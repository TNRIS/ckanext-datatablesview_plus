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

log = logging.getLogger(__name__)
shared_search_table = None


def db_setup():
    if shared_search_table is None:
        define_shared_search_tables()

    if not model.package_table.exists():
        log.critical("Exiting: can not migrate shared search model \
if the database does not exist yet")
        sys.exit(1)
        return

    if not shared_search_table.exists():
        shared_search_table.create()
        print("Created security TOTP table")
    else:
        print("Security TOTP table already exists -- skipping")


def define_shared_search_tables():
    global shared_search_table
    if shared_search_table is not None:
        return
    shared_search_table = Table(
        Column('id', types.Integer, primary_key=True, default=make_uuid),
        Column('key', types.UnicodeText, default=u''),
        Column('json', types.UnicodeText, default=u''),
    )
    
    mapper(
        DTSharedSearch,
        shared_search_table
    )

class DTSharedSearch(DomainObject):
    @classmethod
    def create_for_user(cls, user_name):
        """
        Set up the
        :param user_name:
        :return:  DTSharedSearch model -- saved
        """
        if user_name is None:
            raise ValueError("User name parameter must be supplied")
        new_secret = pyotp.random_base32()
        security_challenge = cls.get_for_user(user_name)
        user = DTSharedSearch.Session.query(User).filter(
            User.name == user_name).first()

        if security_challenge is None:
            security_challenge = DTSharedSearch(user_id=user.id,
                                              secret=new_secret)
        else:
            security_challenge.secret = new_secret

        security_challenge.last_successful_challenge = None
        security_challenge.save()
        return security_challenge

    @classmethod
    def get_for_user(cls, user_name):
        '''Finds a securityTOTP object using the user name
        :raises ValueError if the user_name is not provided
        '''
        if user_name is None:
            raise ValueError("User name parameter must be supplied")

        challenger = DTSharedSearch.Session.query(DTSharedSearch)\
            .join(User, User.id == DTSharedSearch.user_id) \
            .filter(User.name == user_name).first()
        return challenger

    def __repr__(self):
        return '<DTSharedSearch key={}>'\
            .format(self.key)

    def __str__(self):
        return self.__repr__().encode('ascii', 'ignore')
