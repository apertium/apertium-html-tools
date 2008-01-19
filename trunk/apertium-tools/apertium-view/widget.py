import gtk.glade

try:
    import gtksourceview2 as sourceview
    
except:
    import SourceViewDummy as sourceview


handlers = {}


def gtk_handler(f):
    handlers[f.__name__] = f
    return f


def glade_load_and_connect(fname, **kwargs):
    widget_tree = gtk.glade.XML(fname, **kwargs)
    widget_tree.signal_autoconnect(handlers)
    return widget_tree


def make_source_view(text_buffer):
    text_view = sourceview.View(text_buffer)
    text_view.set_editable(True)
    text_view.set_wrap_mode(gtk.WRAP_WORD)
    text_view.show()
    
    return text_view
