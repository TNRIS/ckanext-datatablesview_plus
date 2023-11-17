# encoding: utf-8

import ckan.plugins as p
import ckan.plugins.toolkit as toolkit
from ckanext.datatablesview_plus import blueprint
import ckanext.datatablesview_plus.cli as cli

from ckanext.datatablesview_plus.model import define_shared_search_tables, db_setup, DTSharedSearch
import base64

default = toolkit.get_validator(u'default')
boolean_validator = toolkit.get_validator(u'boolean_validator')
ignore_missing = toolkit.get_validator(u'ignore_missing')


def dtprv_date(iso_date_string):
    """
    Return a MM/DD/YYYY formatted text date string 

    Args: iso date string
        
    Returns:
        string: MM/DD/YYYY formatted text date string

    """

    import dateutil 
    
    date = dateutil.parser.parse(iso_date_string)
    native = date.replace(tzinfo=None)
    format='%b %d, %Y'
    return native.strftime(format) 

def get_sharesearch_state(uuid, encoded=False):
    """
    Retrieve sharesearch record

    Args: sharesearch record uuid
        
    Returns:
        sharesearch record

    """

    sharesearch = DTSharedSearch.get_shared_search(uuid)

    if sharesearch:
        if encoded:
            b64 =  base64.b64encode(sharesearch.json.encode('UTF-8'))
            return b64.decode('UTF-8')
        else:
            return sharesearch.json
    return None

class DatatablesviewPlusPlugin(p.SingletonPlugin):
    u'''
    DataTables table view plugin using v1.13.1 of DataTables
    '''
    p.implements(p.IConfigurer, inherit=True)
    p.implements(p.IResourceView, inherit=True)
    p.implements(p.IBlueprint)
    p.implements(p.IClick)
    p.implements(p.ITemplateHelpers)


    # IBlueprint

    def get_blueprint(self):
        return blueprint.datatablesview_plus

    # IClick
    def get_commands(self):
        return cli.get_commands()

    # IConfigurer

    def update_config(self, config):

        # map shared search model to db schema
        define_shared_search_tables()

        u'''
        Set up the resource library, public directory and
        template directory for the view
        '''
        toolkit.add_template_directory(config, u'templates')
        toolkit.add_public_directory(config, 'public')
        toolkit.add_resource(u'assets', u'ckanext-datatablesview_plus')

   # ITemplateHelpers

    def get_helpers(self):
            """Register helper functions"""

            return {
                'dtprv_date': dtprv_date,
                'get_sharesearch_state': get_sharesearch_state,

            }
    

    # IResourceView

    def can_view(self, data_dict):
        resource = data_dict['resource']
        return resource.get(u'datastore_active')

    def view_template(self, context, data_dict):
        return u'datatables/datatables_view.html'

    def form_template(self, context, data_dict):
        return u'datatables/datatables_form.html'

    def info(self):
        return {
            u'name': u'datatablesview_plus',
            u'title': u'Table',
            u'filterable': True,
            u'iframed': True,
            u'icon': u'table',
            u'requires_datastore': True,
            u'default_title': p.toolkit._(u'Table'),
            u'schema': {
                u'responsive': [default(False), boolean_validator],
                u'show_fields': [ignore_missing],
                u'filterable': [default(True), boolean_validator],
            }
        }

