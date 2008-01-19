import gtk
import gobject
from gtk import gdk

import pygtk
pygtk.require('2.0')

class VSizerPane(gtk.Widget):
    """
    http://www.learningpython.com/2006/07/25/writing-a-custom-widget-using-pygtk/
    """
    def __init__(self, pixmap_path, resizee):
        gtk.Widget.__init__(self)

        #self.set_size_request(-1, 100)
        self.button_down = False
        self.pixmap = gdk.Pixmap(None, 10, 10, 24)
        self.pixmap_path = pixmap_path

        self.resizee = resizee

    def do_realize(self):
        self.set_flags(self.flags() | gtk.REALIZED)

        self.window = gdk.Window(
            self.get_parent_window(),
            width = self.allocation.width,
            height = self.allocation.height,
            window_type = gdk.WINDOW_CHILD,
            wclass = gdk.INPUT_OUTPUT,
            event_mask = self.get_events()
                       | gdk.EXPOSURE_MASK
                       | gdk.BUTTON1_MOTION_MASK
                       | gdk.BUTTON_PRESS_MASK
                       | gdk.BUTTON_RELEASE_MASK            
                       | gtk.gdk.POINTER_MOTION_MASK
                       | gtk.gdk.POINTER_MOTION_HINT_MASK)

        self.window.set_user_data(self)
        self.style.attach(self.window)
                
        # The default color of the background should be what
        # the style (theme engine) tells us.
        self.style.set_background(self.window, gtk.STATE_NORMAL)
        self.window.move_resize(*self.allocation)
        # load the star xpm
        self.pixmap, mask = gtk.gdk.pixmap_create_from_xpm(
                self.window, self.style.bg[gtk.STATE_NORMAL], self.pixmap_path)
        
        # self.style is a gtk.Style object, self.style.fg_gc is
        # an array or graphic contexts used for drawing the forground
        # colours       
        self.gc = self.style.fg_gc[gtk.STATE_NORMAL]
        
        #self.connect("motion_notify_event", self.motion_notify_event)
        self.connect("motion_notify_event", self.motion_notify_event)
        self.connect("button_press_event", self.button_press_event)
        self.connect("button_release_event", self.button_release_event)

        self.queue_resize()

    def do_unrealize(self):
        #self.window.destroy()
        self.window.set_user_data(None)
        
    def do_size_request(self, requisition):
        """From Widget.py: The do_size_request method Gtk+ is calling
        on a widget to ask it the widget how large it wishes to be. 
        It's not guaranteed that gtk+ will actually give this size 
        to the widget.  So we will send gtk+ the size needed for
        the maximum amount of stars"""

        requisition.width, requisition.height = self.pixmap.get_size() # TODO: Is this okay?

    def do_size_allocate(self, allocation):
        """The do_size_allocate is called by when the actual 
        size is known and the widget is told how much space 
        could actually be allocated Save the allocated space
        self.allocation = allocation. The following code is
        identical to the widget.py example"""
        
        if self.flags() & gtk.REALIZED:
            self.window.move_resize(*allocation)

    def do_expose_event(self, event):
        """This is where the widget must draw itself."""
        
        # My code is fucking terrible! But it works for now, so let's just
        # leave it at that :).

        rect = self.parent.get_allocation()
        width, height = self.pixmap.get_size()

        for count in range(0, 2 * int(round(rect.width / width))):
            self.window.draw_drawable(self.gc, self.pixmap, 0, 0,
                                      width * count, 0,-1, -1)

    def motion_notify_event(self, widget, event):
        if self.button_down:
            rect = self.resizee.get_allocation()
            _, y_delta = event.get_coords()
            self.resizee.set_size_request(-1, rect.height + int(y_delta))
            
            #print str(event.get_coords())

    def button_press_event(self, widget, event):
        self.button_down = True

    def button_release_event(self, widget, event):
        self.button_down = False


gobject.type_register(VSizerPane)
