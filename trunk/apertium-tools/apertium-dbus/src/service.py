import gobject

import dbus
import dbus.service 
import dbus.mainloop.glib

dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
method = dbus.service.method


class Service(dbus.service.Object):
    def __init__(self, name):
        dbus.service.Object.__init__(self, dbus.SessionBus(), name)


def make_proxy(path, interface):
    slash_index = path.index('/')
    dbus_name = path[:slash_index]
    obj_name  = path[slash_index:]

    return dbus.Interface(dbus.SessionBus().get_object(dbus_name, obj_name), interface)


def add_signal_receiver(*args, **kwargs):
    dbus.SessionBus().add_signal_receiver(*args, **kwargs)


mainloop = None

def quit():
    mainloop.quit()

def run_as(name):
    global mainloop
    
    name = dbus.service.BusName(name, dbus.SessionBus())    
    mainloop = gobject.MainLoop()
    mainloop.run()

