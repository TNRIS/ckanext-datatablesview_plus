# -*- coding: utf-8 -*-

from __future__ import print_function
import click

from ckanext.datatablesview_plus.model import db_setup, DTSharedSearch

def get_commands():
    return [datatablesview_plus]


@click.group(short_help="Commands for managing ckanext-datatablesview_plus")
def datatablesview_plus():
    pass


@datatablesview_plus.command()
def migrate():
    """
    Create the database table to support Shared Search URL lookups
    """
    print("Migrating database for ckanext-datatablesplus_view")
    db_setup()
    print("Finished tables setup for ckanext-datatablesplus_view")


@datatablesview_plus.command()
def delete(
    keys: tuple[str, ...]
):
    """
    Delete Shared Search key(s)
    Example: ckan -c ckan.ini datatablesview_plus delete key1 key2 key3
    """
    print( 'Key deletion is not yet implemented' )
    print( keys )
    #print( keys )
    #print('Removing Shared Search key {}'.format(key))
    #DTSharedSearch.delete_key(key)
    #print('Success!')
