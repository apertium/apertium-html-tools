def call(cmdline, _in):
    import os

    """A convenience function to invoke a subprocess with the
    parameter list name (where the first argument is the name
    of an executable). The subprocess is fed the contents of
    input via stdin. We collect the output of both stdout and
    stderr from the subprocess. If stderr is not empty, we
    raise an exception, otherwise we return the contents of
    stdout."""
    child_in, child_out, child_err = os.popen3(" ".join(cmdline))

    child_in.write(_in)
    child_in.close() # You MUST close the child's stdin to get output from some programs

    out = child_out.read()
    child_out.close()
    err = child_err.read()
    child_err.close()

    return out, err

class OsCommand(object):
    def __init__(self, cmd):
        self.cmd = cmd

    def communicate(self, _input):
        print "calling", self.cmd
        return call(self.cmd, _input)

