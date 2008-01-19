#!/usr/bin/env python

usage = """Usage:
python example-service.py &
"""
    
import os.path as path
import service


class Info(service.Service):
    def __init__(self, apertium_dir):
        service.Service.__init__(self, '/')
        self._directory = apertium_dir
    
    @service.method("org.apertium.Info", in_signature='', out_signature='s')
    def directory(self):
        return self._directory
    
    @service.method("org.apertium.Info", in_signature='', out_signature='s')
    def mode_directory(self):
        return path.join(self.directory(), "share", "apertium", "modes")

    @service.method("org.apertium.Info", in_signature='', out_signature='as')
    def modes(self):
        import os
        modes = []
        
        for dirent in os.listdir(self.mode_directory()):
            fname, ext = path.splitext(dirent)
            if ext == ".mode":
                modes.append(fname)

        return modes


    @service.method("org.apertium.Info", in_signature='s', out_signature='aas')
    def get_pipeline(self, mode):
        import re
        
        mode_content = open(path.join(self.mode_directory(), mode + '.mode')).read()
        return [re.split('[ \t\n]*', command.strip()) for command in mode_content.split('|')]


    pipeline_filters = {'txt' : ('apertium-destxt', 'apertium-retxt')}

    @service.method("org.apertium.Info", in_signature='s', out_signature='as')
    def get_filters(self, _type):
        return [path.join(self.directory(), 'bin', exe) for exe in self.pipeline_filters[_type]]


def quit_handler(*args):
    service.quit()



from optparse import OptionParser, make_option    

option_list = [
    make_option("-p", "--path", dest="filename", type="string",
                help="The prefix of the Apertium installation."),
    make_option("-v", "--verbose",
                help="Be verbose")
    ]

usage = "usage: %prog [options] arg"

if __name__ == "__main__":
    parser = OptionParser(usage, option_list = option_list)
    options, args = parser.parse_args()

    info = Info(options.filename)
    service.add_signal_receiver(quit_handler, dbus_interface = "org.apertium.General", signal_name = "QuitSignal")
    service.run_as("org.apertium.info")
