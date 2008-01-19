#!/usr/bin/env python

usage = """Usage:
python example-service.py &
"""
    
import os.path as path
import os
import logging

import service
from command_line import call

translate = None


def add_options(cmdline, options):
    default_options = {'mark_unknown': 'false'}
    default_options.update(options)

    def parse_bool(string):
        if string == 'true':
            return True
        elif string == 'false':
            return False
        else:
            raise Exception("Illegal boolean value")

    cmdline = list(cmdline)
    if not parse_bool(default_options['mark_unknown']):
        cmdline.append('-u')

    return cmdline

class Translate(service.Service):
    def __init__(self, cmd, modes):
        super(Translate, self).__init__("/")
        self.cmd = cmd
        self.modes = modes

    @service.method("org.apertium.Translate", in_signature='sa{ss}s', out_signature='s')
    def translate(self, pair, options, text):
        if pair not in self.modes:
            raise Exception("Invalid language pair")
            
        out, err = call(add_options([self.cmd, pair], options), text)
        return out
        

def convert_to_dbus_name(name):
    import re
    return re.sub('[-]', '_', name)

class TranslatePair(service.Service):
    def __init__(self, mode):
        super(TranslatePair, self).__init__("/" + convert_to_dbus_name(mode))
        self.mode = mode

    @service.method("org.apertium.Mode", in_signature='a{ss}s', out_signature='s')
    def translate(self, options, text):
        return translate.translate(self.mode, options, text)


def create_translation_objects():
    global translate
    
    objs = []
    
    try:
        info = service.make_proxy("org.apertium.info/", "org.apertium.Info")

    except:
        raise Exception("Could not connect to the Apertium information service")

    modes = info.modes()
    translate = Translate(path.join(info.directory(), 'bin', 'apertium'), modes)

    for mode in modes:
        objs.append(TranslatePair(mode))

    return objs
        

def quit_handler(*args):
    service.quit()

def setup_logging():
    logging.basicConfig(level=logging.DEBUG,
                        format='%(asctime)s %(levelname)-8s %(message)s',
                        datefmt='%a, %d %b %Y %H:%M:%S',
                        filename='/tmp/mode.log',
                        filemode='w')
    
if __name__ == "__main__":
    setup_logging()
    objs = create_translation_objects()
    service.add_signal_receiver(quit_handler, dbus_interface = "org.apertium.General", signal_name = "QuitSignal")
    service.run_as("org.apertium.mode")
