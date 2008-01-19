SUBDIRS = src

EXTRA_DIST = org.apertium.info.service org.apertium.mode.service

SERVICEDIR=$(prefix)/share/dbus-1/services/

install-data-local:
	$(INSTALL_DATA) org.apertium.info.service $(SERVICEDIR)
	$(INSTALL_DATA) org.apertium.mode.service $(SERVICEDIR)
