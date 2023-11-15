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
@click.argument("json_blob")
def test_insert(
    json_blob: str
):
    """
    Test insert
    """
    print("Test insert")
    DTSharedSearch.create_shared_search( json_blob )
    print("Finished test insert")

@datatablesview_plus.command()
@click.argument("uuid")
def test_get(
    uuid: str
):
    """
    Test get
    """
    print("Test get")
    shared_search = DTSharedSearch.get_shared_search(uuid)
    print('  UUID: ', shared_search.uuid)
    print('  Access Count: ', shared_search.access_count)
    print('  Last Access: ', shared_search.last_access)
    print('  JSON: ', shared_search.json)
    print("Finished test get")

@datatablesview_plus.command()
@click.argument("uuid")
@click.argument("json_blob")
def test_update(
    uuid: str,
    json_blob: str
):
    """
    Test update
    """
    print("Test update")

    shared_search = DTSharedSearch.get_shared_search(uuid)
    print('  Before UUID: ', shared_search.uuid)
    print('  Before Access Count: ', shared_search.access_count)
    print('  Before Last Access: ', shared_search.last_access)
    print('  Before JSON: ', shared_search.json)
    print('-=+=-=+=-=+=-')
    shared_search = DTSharedSearch.update_shared_search(uuid, json_blob)
    print('  After UUID:  ', shared_search.uuid)
    print('  After Access Count:  ', shared_search.access_count)
    print('  After Last Access:  ', shared_search.last_access)
    print('  After JSON:  ', shared_search.json)
    print("Finished test update")

@datatablesview_plus.command()
@click.argument("uuids", nargs=-1)
def test_delete(
    uuids: tuple
):
    """
    Delete Shared Search(es)
    Example: ckan -c ckan.ini datatablesview_plus delete uuid1 uuid2 uuid3
    """
    print('Test delete')
    print(uuids)
    if DTSharedSearch.delete_shared_search( uuids ):
        print('Finished test delete')
    else:
        print('Error during test deletion')