#!/usr/bin/env python

# GTK oriented packages
import gobject
import gtk, sys
import pygtk

pygtk.require('2.0')

# Logging
import logging

# Process oriented packages
from subprocess import Popen, PIPE
import threading
from Queue import Queue

import dbus

from widget import *
import TextWidget 

# Global variables
class Globals:
    marcar = False
    pipeline_executor = None
    source_lang_manager = None
    source_style_manager = None
    handlers = {}
    wTree = None


class PipelineExecutor(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.queue = Queue()
        self.setDaemon(True)
        self.last_f = lambda: None

    def run(self):
        while True:
            self.last_f = self.queue.get()
            
            while self.queue.qsize() > 0:
                self.last_f = self.queue.get()

            self.last_f()

    def add(self, stage):
        self.queue.put(stage)

    def reexec(self):
        self.add(self.last_f)
        

class Cell(object):
    """A really simple dataflow class. It only supports building dataflow chains.

    >>> a = lambda x: 'a' + x + 'a'
    >>> b = lambda x: 'b' + x + 'b'
    >>> c_a = Cell(a)
    >>> c_b = c_a.set_next(Cell(b))
    >>> c_a('?')
    'ba?ab'

    It just like a chain of lazy function invocations. This class supports the
    execution of the Apertium pipeline. For each Apertium module, there will be
    a cell. After every such cell, there is a cell which contains a function to
    update one of our text views. 
    """
    def __init__(self, func):
        self.func = func
        self.next = lambda x: x

    def __call__(self, val):
        out = self.func(val)
        return self.next(out)


# Widget convenience functions

def show(widget):
    widget.show()
    return widget


def configure_combo(combo):
    combo.set_model(gtk.ListStore(gobject.TYPE_STRING))
    cell = gtk.CellRendererText()
    combo.pack_start(cell, True)
    combo.add_attribute(cell, 'text', 0)
    return combo


def make_text_buffer():
    buf = sourceview.Buffer()
    buf.set_language(Globals.source_lang_manager.get_language('apertium'))
    buf.set_style_scheme(Globals.source_style_manager.get_scheme('tango'))
    buf.set_highlight_syntax(True)
    buf.set_highlight_matching_brackets(False)

    return buf


def make_text_widget(cmd):
    text_buffer = make_text_buffer()
    src_view = show(make_source_view(text_buffer))
    return text_buffer, TextWidget.make(" ".join(cmd), src_view)


def text_window(title, text_buffer):
    wTree = gtk.glade.XML("TextWindow.glade")
    
    wnd = wTree.get_widget("text_window")
    wnd.set_title(title)

    def close(widget, data = None):
        wnd.hide()
        wnd.destroy()

    wnd.connect("destroy", close)

    text_view = make_source_view(text_buffer)
    scrolled_window = wTree.get_widget("scrolled_window")
    scrolled_window.add_with_viewport(text_view)
    
    wTree.signal_autoconnect({'on_btn_close_clicked': close})
    
    wnd.show()    


# GTK Handlers which are automatically connected to the Glade
# events with the same names

@gtk_handler
def on_wndMain_destroy(widget, data = None):
    gtk.main_quit()


@gtk_handler
def on_btnQuit_clicked(widget, data = None):
    gtk.main_quit()


@gtk_handler
def on_wndMain_delete_event(widget, event, data = None):
    return False


@gtk_handler
def on_chkMarkUnknown_toggled(widget, data = None):
    Globals.marcar = not Globals.marcar
    Globals.pipeline_executor.reexec()


@gtk_handler
def on_comboPair_changed(widget, data = None):
    setup_pair(widget.get_model().get_value((widget.get_active_iter()), 0))


@gtk_handler
def on_scrollMain_size_allocate(widget, allocation, data = None):
    #print "x=%d, y=%d, width=%d, height=%d" % (allocation.x, allocation.y, allocation.width, allocation.height)
    #TODO: Add code to resize the contents of the main scroll window.
    pass

def call(params, _input):
    from subprocess import Popen, PIPE
    
    proc = Popen(params, stdin=PIPE, stdout=PIPE, stderr=PIPE)
    return proc.communicate(_input)
    

def make_runner(cmd):
    def process_cmd_line(cmd):
        if len(cmd) > 1   and cmd[1] == '$1' and Globals.marcar:
            return cmd[0], '-g', cmd[2];
        elif len(cmd) > 1 and cmd[1] == '$1' and not Globals.marcar:
            return cmd[0], '-n', cmd[2];
        else:
            return cmd


    def runner(val):
        out, err = call(list(process_cmd_line(cmd)), str(val))
        return out

    return Cell(runner)


def make_observer(text_buffer, update_handler):
    """An observer cell is used to update the contents of a GTK text buffer. See the doc for setup_pair to
    understand where observers fit in.
    """
    
    def observer(val):
        def post_update():
            # If we don't block the onchange event, then we'll invoke two updates
            # because and update will already occur due to data flowing through
            # cell pipeline
            text_buffer.handler_block(update_handler)
            text_buffer.set_text(val)
            text_buffer.handler_unblock(update_handler)
            
        # This will be executed in the GTK main loop
        gobject.idle_add(post_update)        
        return val

    return Cell(observer)


def update(widget, runner):
    def get_text(buf):
        return buf.get_text(buf.get_start_iter(), buf.get_end_iter())

    Globals.pipeline_executor.add(lambda: runner(get_text(widget)))


def replace_child(container, new_child):
    child = container.get_children()[0] # we must keep a reference (child) before removing it from portMain
    container.remove(child)
    container.add(new_child)


def setup_pair(name):
    """setup_pair is responsible for:
    1.) Creating the GTK TextViews for each of the stages used in the processing of the pair named by 'name'
    2.) Creating a dataflow pipeline which will: 
        2.1) be used to determine in which TextView the user made any changes,
        2.2) updating the TextViews as data flows through the pipeline.
        
    Currently, we build a pipeline which looks something like the following (for en-af):
    
     Filter first TextView       related to the TextView for lt-proc      related to the TextView for apertium-tagger
     __________/\___________    _________________/\__________________    _____________________/\_____________________
    /                       \  /                                     \  /                                            \
    [runner: apertium-destxt]->[runner: lt-proc]->[observer]->[update]->[runner: apertium-tagger]->[observer]->[update]->...
                     /\                             \              /\                                \              /\
                     /                               \             /                                  \             /
                  changed                          set_text     changed                             set_text     changed
                   /                                   \         /                                      \         /
                  /                                     \       /                                        \       /
                 /                                      \/     /                                         \/     /
        GTK TextView                                  GTK TextView                                     GTK TextView
    
    
    Consider the cells related to a the TextView for lt-proc (this TextView should show up as the second TextView from the
    top in apertium-view for the en-af mode). In order to create what we see in that TextView, 
      lt-proc /usr/local/share/apertium/apertium-en-af/en-af.automorf.bin
    must be executed on the input text (from the very first TextView). But the first cell (marked as '[runner: lt-proc]')
    only invokes lt-proc in a subprocess and pushes the result to the next cell. We would like to display the output of
    lt-proc in the TextView, so the next cell in the pipeline is an 'observer' which sets the text of the TextView.
    
    Suppose now that the user modifies the text in the lt-proc TextView we are considering. We would like this change to
    be reflected in the *rest* of the TextViews, but the current TextView and all preceding it must remain unchanged.
    So we insert an update cell *after* the other cells for the lt-proc stage. We set the onchange event of the lt-proc
    TextView to invoke this update cell.

    Thus, when the user modifies the text in the lt-proc TextView, you can see from the cell pipeline above that the
    change will flow into the cell which executes apertium-tagger; afterwards the observer cell for the apertium-tagger
    window will update the contents of the TextView corresponding to the apertium-tagger phase. The data will continue
    flowing down the pipeline updating the remaining TextViews.
    """
    
    def next(cell, obj):
        cell.next = obj
        return cell.next

    pack_opts = {'expand': False, 'fill': True}

    view_box = show(gtk.VBox(homogeneous = False))

    in_filter, out_filter = Globals.info.get_filters('txt') # this will likely be apertium-destxt and apertium-retxt
    cell = make_runner([in_filter]) # Add the deformatter

    text_widgets = []
    def _make_text_widget(*args):
        text_buffer, text_widget = make_text_widget(*args)
        text_widgets.append(text_widget)
        return text_buffer, text_widget

    text_buffer, text_widget = _make_text_widget(['input text'])
    text_buffer.connect("changed", update, cell)
    view_box.pack_start(text_widget, **pack_opts)

    pipeline = Globals.info.get_pipeline(name)
    for i, cmd in enumerate(pipeline):
        cell = next(cell, make_runner([str(c) for c in cmd]))

        text_buffer, text_widget = _make_text_widget(cmd)
        
        update_cell = Cell(lambda x: x)
        update_handler = text_buffer.connect("changed", update, update_cell)

        if i == len(pipeline) - 1: # Before our last TextView, insert an apertium-retxt phase
            cell = next(cell, make_runner([out_filter]))
        
        cell = next(cell, make_observer(text_buffer, update_handler)) # Corresponds to [observer] in description above
        cell = next(cell, update_cell) # Corresponds to [update] in description above
        
        view_box.pack_start(text_widget, **pack_opts) # Add a TextView to our window

    text_widgets[0].wTree.get_widget("btnCollapsed").set_active(False)  # Uncollapse the first and last 
    text_widgets[-1].wTree.get_widget("btnCollapsed").set_active(False) # TextViews

    replace_child(Globals.wTree.get_widget("portMain"), view_box)


def main_window():
    Globals.wTree = glade_load_and_connect("MainWindow.glade")
    comboPair = configure_combo(Globals.wTree.get_widget("comboPair"))
    
    for mode in Globals.info.modes():
        comboPair.append_text(str(mode))
        
    comboPair.set_active(0)
    
    
def setup_logging():
    logging.basicConfig(level=logging.DEBUG,
                        format='%(asctime)s %(levelname)-8s %(message)s',
                        datefmt='%a, %d %b %Y %H:%M:%S',
                        filename='apertium.log',
                        filemode='w')


def init():
    Globals.pipeline_executor = PipelineExecutor()
    Globals.pipeline_executor.start()

    Globals.source_lang_manager  = sourceview.language_manager_get_default()
    Globals.source_style_manager = sourceview.style_scheme_manager_get_default()
    Globals.info = dbus.Interface(dbus.SessionBus().get_object("org.apertium.info", "/"), "org.apertium.Info")

    setup_logging()
    main_window()


if __name__ == "__main__":
    gtk.gdk.threads_init()
    init()
    logging.debug('Completed init phase')
    gtk.main()
    logging.debug('Graceful shutdown')

