import os, string
from widget import *

MIN_SIZE = 30


def get_wTree(widget):
    try:
        return getattr(widget, "wTree")
    except:
        return get_wTree(widget.get_parent())


def get_widget(self, widget):
    wTree = get_wTree(self)
    return wTree.get_widget(widget)


def set_y_size(widget, sz):
    widget.set_size_request(-1, max(sz, MIN_SIZE))


def is_collapsed(widget):
    return widget.get_active()


@gtk_handler
def on_statusbar_motion_notify_event(widget, event):
    if widget.button_down:
        get_widget(widget, "btnCollapsed").set_active(False)
        resizee = get_widget(widget, "scrolledwindow")
        
        rect = resizee.get_allocation()
        _, y_delta = event.get_coords()
        
        set_y_size(resizee, rect.height + int(y_delta) - widget.y_offset)


@gtk_handler
def on_statusbar_button_release_event(widget, event):
    widget.button_down = False


@gtk_handler
def on_statusbar_button_press_event(widget, event):
    if not is_collapsed(get_widget(widget, "btnCollapsed")):
        widget.button_down = True
        widget.y_offset = int(event.get_coords()[1])


@gtk_handler
def on_btnCollapsed_toggled(widget, data=None):
    resizee = get_widget(widget, "scrolledwindow")

    if not is_collapsed(widget):
        resizee.show()

    else:
        widget.old_height = resizee.get_allocation().height
        resizee.hide()


@gtk_handler
def on_wndText_destroy(widget, data=None):
    widget.hide()
    widget.destroy()


@gtk_handler
def on_btnCloseTextWindow_clicked(widget, data=None):
    get_widget(widget, "wndText").destroy()


@gtk_handler
def on_wndText_delete_event(widget, event, data=None):
    return False


@gtk_handler
def on_btnOpenWindow_clicked(widget, data=None):
    wTree = glade_load_and_connect("TextWindow.glade")

    wTree.get_widget("wndText").wTree = wTree
    wTree.get_widget("wndText").set_title(get_widget(widget, "entry").get_text())

    text_view = make_source_view(widget.text_buffer)
    scrolled_window = wTree.get_widget("scrolled_window")
    scrolled_window.add_with_viewport(text_view)
    

def make(txt, child):
    wTree = glade_load_and_connect("TextWidget.glade", root="vbox")

    widget = wTree.get_widget("vbox")
    widget.wTree = wTree

    statusbar = wTree.get_widget("statusbar")
    statusbar.button_down = False
    
    path = txt.split(' ');
    path[0] = os.path.basename(path[0]);
    txt = string.join(path, ' ');
    wTree.get_widget("entry").set_text(txt)
    wTree.get_widget("viewport").add(child)

    wTree.get_widget("btnCollapsed").set_active(True)
    on_btnCollapsed_toggled(wTree.get_widget("btnCollapsed"))

    wTree.get_widget("btnOpenWindow").text_buffer = child.get_buffer()

    return widget
    
    
