#!/usr/bin/python

import os        
import new
import sys
from Queue import Queue # A queue type to communicate between threads
import thread # A simple thread launcher
from ConfigParser import ConfigParser
# The ConfigParser is used to store preferences of the program

# GTK related imports
import gobject
import gtk
import gtk.gdk
import pygtk

import dbus # Used to connect to the Apertium D-Bus service

from i18n import _
from glade import GladeXML


class MainWindow:
    def setup_combo(self, modes, combo):
        """Set the combo box up to display simple a list of text and
        add everything in 'modes' to the list.
        """
        combo.set_model(gtk.ListStore(gobject.TYPE_STRING))
        cell = gtk.CellRendererText() # Tell the combobox we're just rendering text
        combo.pack_start(cell, True) # Add the text renderer to the combo box
        combo.add_attribute(cell, "text", 0) # Tell the combobox that we just want to show text

        for mode in modes: # Add everything in 'modes' to the combobox
            combo.append_text(mode)

        combo.set_active(0) # Set the combobox to the first entry

        return combo


    def options(self):
        if self.chkMarkUnknown.get_active():
            return {"mark_unknown": "true"}
        else:
            return {}


    def load_config(self):
        """Read the configuration data. First read default data from 'defaults.cfg'
        and then user config data from '~/.apertium-simple-viewer.cfg'. Tell the
        glade object to update stored widget properties based on the config data.
        """
        self.config.readfp(open('defaults.cfg'))
        self.config.read([os.path.expanduser('~/.apertium-simple-viewer.cfg')])
        self.glade.load_gtk_state(self.config)

    def save_config(self):
        """Store the configuration data to the user file '~/.apertium-simple-viewer.cfg'.
        Before storing, tell the glade object to dump the widget state to the configuration
        object self.config.
        """
        self.glade.dump_gtk_state(self.config)
        self.config.write(open(os.path.expanduser('~/.apertium-simple-viewer.cfg'), 'w'))
    
    def __init__(self, path):
        self.config = ConfigParser() # An object which loads/stores preferences
        self.bus = dbus.SessionBus()
        # Create a proxy object to the D-Bus object org.apertium.info/ using the interface org.apertium.Info
        self.info = dbus.Interface(self.bus.get_object("org.apertium.info", "/"), "org.apertium.Info")
        self.input_queue = Queue()  # Thread communication queue
        self.glade = GladeXML(path) # Instantiate our custom Glade class which extends the gtk.glade.GladeXML class
        self.glade.connect(self);   # Try to connect the signals defined in the glade file to methods defined in self

        # Get handles objects of interest in the glade file
        self.buffer         = self.glade.get_widget("txtInput").get_buffer()
        self.output_buffer  = self.glade.get_widget("txtOutput").get_buffer()
        self.wndMain        = self.glade.get_widget("wndMain")
        self.dlgAbout       = self.glade.get_widget("dlgAbout")
        self.chkMarkUnknown = self.glade.get_widget("chkMarkUnknown")
        self.comboPair      = self.setup_combo(self.info.modes(), self.glade.get_widget("comboPair"))

        self.buffer.connect("changed", self.on_buffer_changed)

        # Start the thread which will handle 
        thread.start_new_thread(self.translator_loop, ())

        self.load_config()
        self.wndMain.show()

        
    def translator_loop(self):
        """This runs as a thread which invokes Apertium D-Bus methods.

        We run this in a thread, since it takes a perceptible amount
        of time to execute an Apertium call.

        Only one Apertium call at most is ever active. We ensure this by
        running only one thread. This thread receives updates via a queue.

        While it is busy waiting for an Apertium call to return, its
        update queue might receive requests (this happens when the user is
        typing while Apertium is running). We're only ever interested in the
        latest item added to the queue, so we discard everything up to that
        point.
        """
        while True:
            options, _input = self.input_queue.get() # Block waiting for something to translate
            while not self.input_queue.empty():          # We're only interested in the latest item in the queue...
                options, _input = self.input_queue.get() # ...so we discard items until we have the latest item

            try:
                result = self.translator.translate(options, _input) # Invoke the Apertium D-Bus translation service

                def update_text():
                    """Take the output from the translation and update the output buffer"""
                    self.output_buffer.set_text(result)
                    return False

                # We probably should call gtk.gdk.thread_enter here...
                gobject.idle_add(update_text) # Post the function into the GTK main loop

            except Exception, e:
                print e # We should probably do exit(1) here


    def on_buffer_changed(self, w):
        self.input_queue.put([self.options(), w.get_text(w.get_start_iter(), w.get_end_iter())])

    ###########################################################
    # Implementations of GTK signals defined in the Glade file

    def on_btnQuit_clicked(self, widget):
        self.save_config()
        gtk.main_quit()

    def on_wndMain_destroy(self, widget):
        gtk.main_quit()

    def on_wndMain_delete_event(self, widget, event):
        self.save_config()
        return False

    def on_btnAbout_clicked(self, widget):
        self.dlgAbout.show()

    def on_dlgAbout_response(self, widget, response):
        self.dlgAbout.hide()

    def update_translation_object(self, pair_name):
        """Given a language pair name like ab-cd, change - to _ so that
        one gets ab_cd. We must do this, because a D-Bus object name cannot
        contain dashes.

        Now, create a proxy object to the Apertium D-Bus translator object for
        the language pair and assign the object to self.translator."""
        dbus_pair_name = "/" + "_".join(pair_name.split("-"))
        self.translator = dbus.Interface(self.bus.get_object("org.apertium.mode", dbus_pair_name), "org.apertium.Mode")

    def on_comboPair_changed(self, widget):
        pair_name = widget.get_model().get_value(widget.get_active_iter(), 0)
        self.update_translation_object(pair_name)
        self.buffer.emit("changed")

    def on_chkMarkUnknown_toggled(self, widget):
        self.buffer.emit("changed")


if __name__ == "__main__":
    gtk.gdk.threads_init()
    wnd = MainWindow("tolk.glade")
    gtk.main();

