from six.moves.urllib.parse import urlencode

from flask import Blueprint
from six import text_type

from sqlalchemy.sql import text

import ckan.model as model
from ckan.common import json
from ckan.plugins import toolkit as tk
\
from ckanext.datatablesview_plus.blueprint import merge_filters
from ckanext.datatablesview_plus.search_builder import parse

get_action = tk.get_action
request = tk.request
h = tk.h

datatablessearch = Blueprint(u'datatablessearch', __name__)


def ajax(resource_view_id):
    resource_view = get_action(u'resource_view_show'
                               )(None, {
                                   u'id': resource_view_id
                               })
    draw = int(request.form[u'draw'])
    search_text = text_type(request.form[u'search[value]'])
    offset = int(request.form[u'start'])
    limit = int(request.form[u'length'])
    view_filters = resource_view.get(u'filters', {})
    user_filters = text_type(request.form[u'filters'])
    filters = merge_filters(view_filters, user_filters)

    if 'searchBuilder[logic]' in request.form.to_dict().keys():
        sql = 'SELECT * FROM "{table_name}" WHERE '.format(table_name=str(resource_view[u'resource_id']))

        search_params = [(key,value) for key, value in request.form.items(multi=True) if 'searchBuilder' in key]
        tree = parse(search_params)
        sql += tree.to_sql()
        context = {
            "model": model,
            "user": tk.g.user,
            "session": model.Session,
            "ignore_auth": True
        }
        print(sql)
        datastore_search = get_action(u'datastore_search_sql')
        unfiltered_response = datastore_search(
            context, {
                u"sql": sql,
                u"limit": 0,
            }
        )
        cols = [f[u'id'] for f in unfiltered_response[u'fields']]
        if u'show_fields' in resource_view:
            cols = [c for c in cols if c in resource_view[u'show_fields']]

        sort_list = []
        i = 0
        while True:
            if u'order[%d][column]' % i not in request.form:
                break
            sort_by_num = int(request.form[u'order[%d][column]' % i])
            sort_order = (
                u'desc' if request.form[u'order[%d][dir]' %
                                        i] == u'desc' else u'asc'
            )
            sort_list.append(cols[sort_by_num] + u' ' + sort_order)
            i += 1

        response = datastore_search(
           context, {
                u"sql": sql,
                u"limit": 0,
            }
        )
    else:


        datastore_search = get_action(u'datastore_search')
        unfiltered_response = datastore_search(
            None, {
                u"resource_id": resource_view[u'resource_id'],
                u"limit": 0,
                u"filters": view_filters,
            }
        )

        cols = [f[u'id'] for f in unfiltered_response[u'fields']]
        if u'show_fields' in resource_view:
            cols = [c for c in cols if c in resource_view[u'show_fields']]

        sort_list = []
        i = 0
        while True:
            if u'order[%d][column]' % i not in request.form:
                break
            sort_by_num = int(request.form[u'order[%d][column]' % i])
            sort_order = (
                u'desc' if request.form[u'order[%d][dir]' %
                                        i] == u'desc' else u'asc'
            )
            sort_list.append(cols[sort_by_num] + u' ' + sort_order)
            i += 1

        response = datastore_search(
            None, {
                u"q": search_text,
                u"resource_id": resource_view[u'resource_id'],
                u"offset": offset,
                u"limit": limit,
                u"sort": u', '.join(sort_list),
                u"filters": filters,
            }
        )

    return json.dumps({
        u'draw': draw,
        u'iTotalRecords': unfiltered_response.get(u'total', 0),
        u'iTotalDisplayRecords': response.get(u'total', 0),
        u'aaData': [[text_type(row.get(colname, u''))
                     for colname in cols]
                    for row in response[u'records']],
    })


datatablessearch.add_url_rule(
    u'/datatables/ajax/<resource_view_id>', view_func=ajax, methods=[u'POST']
)