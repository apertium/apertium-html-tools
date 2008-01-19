import gtk, sys
import pygtk
pygtk.require('2.0')


class DummyLanguage:
    def get_language(*args):
        pass

def language_manager_get_default():
    return DummyLanguage()

class DummyStyle:
    def get_scheme(*args):
        pass

def style_scheme_manager_get_default():
    return DummyStyle()


class Buffer(gtk.TextBuffer):
    def __init__(self, *args):
        gtk.TextBuffer.__init__(self, *args)

    def set_language(self, *args):
        pass

    def set_style_scheme(self, *args):
        pass

    def set_highlight_syntax(self, *args):
        pass

    def set_highlight_matching_brackets(self, *args):
        pass


class View(gtk.TextView):
    def __init__(self, *args):
        gtk.TextView.__init__(self, *args)

