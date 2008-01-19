__module_name__ = "translate"
__module_version__ = "0.1"
__module_description__ = "Uses Apertium to translate users' text"
__module_author__ = "Wynand Winterbach <wynand.winterbach@gmail.com"

import xchat
import dbus

active_pairs = set()

translator = dbus.Interface(dbus.SessionBus().get_object("org.apertium.mode", "/"), "org.apertium.Translate")
info  = dbus.Interface(dbus.SessionBus().get_object("org.apertium.info", "/"), "org.apertium.Info")


def no_reenter(f):
    """While the function f is running, it can't be invoked again.
    Any attempt to invoke it during this period will only return
    xchat.EAT_NONE.

    This is used to annotate other functions. We need this if f
    is triggered by an event x and f itself will trigger event x.
    Without this protection, and infinite loop will occur.

    The Beacon class variable set states whether we are busy executing
    f. If a function wants to execute f, it checks whether the beacon
    is set. If not, it set it and executes f. Otherwise
    xchat.EAT_NONE is returned. 
    """

    class Beacon:
        set = False
    
    def new_func(*args, **kwargs):
        if not Beacon.set:
            Beacon.set = True
            try:
                ret = f(*args, **kwargs)
                return ret

            finally:
                Beacon.set = False

        else:
            return xchat.EAT_NONE

    return new_func


def add_code(num, text):
    """Add MIRC ^C style 'tags' to a string. A 'tag' is
    identified by a number (num in this function)."""
    escape = "\x03"
    return "".join([escape, str(num), text, escape])

def grey(text):
    return add_code(15, text)

def dark_grey(text):
    return add_code(14, text)

@no_reenter 
def translate(word, word_eol, userdata):
    """This must be non-reentrable, because it is triggered by the 'Channel Message' event,
    but will itself trigger this event."""
    
    nick, text = word[0:2]

    xchat.emit_print("Channel Message", nick, text)

    for pair in active_pairs:
        #print dark_grey("[%s]" % pair), grey(translator.translate(pair, {}, text))
        xchat.emit_print("Channel Message", grey("[%s] %s" % (pair, nick)), grey(translator.translate(pair, {}, text)))

    return xchat.EAT_XCHAT


def add_pair(word, word_eol, userdata):
    if len(word) != 2:
        print "usage: /add_pair <language_pair"
        return xchat.EAT_NONE

    _, pair = word

    if pair not in info.modes():
        print "invalid language pair"
        return xchat.EAT_NONE

    print "Adding %s" % pair
    active_pairs.add(pair)
    return xchat.EAT_NONE


def remove_pair(word, word_eol, userdata):
    try:
        active_pairs.remove(word[1])
        print "Removing %s" % word[1]
        
    except KeyError:
        print "No such pair is active"

    return xchat.EAT_NONE


xchat.hook_print("Channel Message", translate) 
xchat.hook_command("add_pair", add_pair, help="/add_pair <pair> will start using the language pair to translate IRC text")
xchat.hook_command("remove_pair", remove_pair, help="/remove_pair <pair> will stop using the language pair to translate IRC text")

print "Plugin translate loaded!"
