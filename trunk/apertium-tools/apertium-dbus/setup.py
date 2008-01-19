#!/usr/bin/env python

from os import walk
try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup
    
setup(name='apertium-py',
      version="0.1",
      author='Wynand Winterbach',
      author_email='wynand.winterbach@gmail.com',
      packages=['apertium'],
      description='A library with .',
      classifiers=[
        'Development Status :: 1 - Alpha',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'Intended Audience :: Developers',
        'Programming Language :: Python',
        'License :: GNU General Public License',
        ]
    )
