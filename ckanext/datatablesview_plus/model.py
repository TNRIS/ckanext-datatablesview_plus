# encoding: utf-8

from __future__ import print_function
import datetime
import logging
import pyotp
import sys

from ckan import model
from ckan.model import DomainObject, User
from ckan.model.meta import metadata, mapper
from ckan.plugins import toolkit
from sqlalchemy import Table, Column, types

from ckan.model.types import make_uuid

log = logging.getLogger(__name__)
shared_search = None


def db_setup():
    if shared_search is None:
        define_shared_search_tables()

    if not model.package_table.exists():
        log.critical("Exiting: can not migrate shared search model \
if the database does not exist yet")
        sys.exit(1)
        return

    if not shared_search.exists():
        shared_search.create()
        print("Created datatablesview_plus Shared Search table")
    else:
        print("datatablesview_plus Shared Search table already exists -- skipping")


def define_shared_search_tables():
    global shared_search
    if shared_search is not None:
        return
    shared_search = Table(
        'shared_search', metadata,
        Column('uuid', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('json', types.UnicodeText, default=u''),
        Column('access_count', types.Integer, default=0),
        Column('last_access', types.DateTime, default=datetime.datetime.utcnow)
    )
    
    mapper(
        DTSharedSearch,
        shared_search
    )

class DTSharedSearch(DomainObject):

    @classmethod
    def create_shared_search(cls, json_blob):
        """
        Create a shared_search record for a json_blob
        :param json_blob:
        :return:  DTSharedSearch model -- saved
        """
        if json_blob is None:
            raise ValueError("json_blob parameter must be supplied")    
    
        # Leave our uuid so that make_uuid will autocreate it
        new_shared_search = DTSharedSearch(json=json_blob)
        new_shared_search.save()
        return new_shared_search.uuid

    @classmethod
    def get_shared_search(cls, uuid):
        """
        finds a DTSharedSearch object by uuid
        :raises ValueError if the uuid is not provided
        """
        if uuid is None:
            raise ValueError("uuid parameter must be supplied")

        shared_search = DTSharedSearch.Session.query(DTSharedSearch)\
            .filter(DTSharedSearch.uuid == uuid).first()

        return shared_search

    @classmethod
    def update_shared_search(cls, uuid, json_blob=None):
        """
        finds a DTSharedSearch object by uuid
        :raises ValueError if the uuid is not provided
        """
        if uuid is None:
            raise ValueError("uuid parameter must be supplied")

        shared_search = cls.get_shared_search(uuid)
        shared_search.access_count += 1    
        shared_search.last_access = datetime.datetime.utcnow()
        if json_blob is not None:
            shared_search.json = json_blob
        shared_search.commit()
        return shared_search


    @classmethod
    def delete_shared_search(cls, uuids):
        """
        deletes a list of DTSharedSearch objects by uuid
        :raises ValueError if the uuid list is not provided
        """
        if uuids is None:
            raise ValueError("uuids parameter must be supplied")

        # Delete the UUIDs
        DTSharedSearch.Session.query(DTSharedSearch)\
            .filter(DTSharedSearch.uuid.in_(uuids))\
            .delete(synchronize_session=False)
        
        # Commit the deletion
        DTSharedSearch.Session.commit()

        return True

    def __repr__(self):
        return '<DTSharedSearch uuid={}>'\
            .format(self.uuid)

    def __str__(self):
        return self.__repr__().encode('ascii', 'ignore')
