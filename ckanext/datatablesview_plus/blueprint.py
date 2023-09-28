# encoding: utf-8

from six.moves.urllib.parse import urlencode

from flask import Blueprint
from six import text_type

import ckan.model as model
from ckan.common import json
from ckan.plugins.toolkit import get_action, request, h
from ckan.plugins import toolkit as tk
\
from ckanext.datatablesview_plus.search_builder import parse

import logging
log = logging.getLogger(__name__)

get_action = tk.get_action
request = tk.request
h = tk.h

datatablesview_plus = Blueprint(u'datatablesview_plus', __name__)


def merge_filters(view_filters, user_filters_str):
    u'''
    view filters are built as part of the view, user filters
    are selected by the user interacting with the view. Any filters
    selected by user may only tighten filters set in the view,
    others are ignored.

    >>> merge_filters({
    ...    u'Department': [u'BTDT'], u'OnTime_Status': [u'ONTIME']},
    ...    u'CASE_STATUS:Open|CASE_STATUS:Closed|Department:INFO')
    {u'Department': [u'BTDT'],
     u'OnTime_Status': [u'ONTIME'],
     u'CASE_STATUS': [u'Open', u'Closed']}
    '''
    filters = dict(view_filters)
    if not user_filters_str:
        return filters
    user_filters = {}
    for k_v in user_filters_str.split(u'|'):
        k, sep, v = k_v.partition(u':')
        if k not in view_filters or v in view_filters[k]:
            user_filters.setdefault(k, []).append(v)
    for k in user_filters:
        filters[k] = user_filters[k]
    return filters


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
        datastore_search = get_action(u'datastore_search_sql')
        unfiltered_response = datastore_search(
            context, {
                u"sql": sql,
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

        if '_full_text' in cols:    
           cols.remove( '_full_text' )
        #cols.pop('_full_text')

        unfiltered_response['total'] = len(unfiltered_response.get('records'))

        sql = sql.replace('*', ','.join(['"{}"'.format(col) for col in cols]))
        
        response = datastore_search(
           context, {
                u"sql": sql,
                u"limit": 0,
                u"offset": offset,
                u"limit": limit,
                u"sort": u', '.join(sort_list),
                u"filters": filters,
            }
        )
        # Need to be fixed to get the total number of records
        response['total'] = len(response.get('records'))

    elif search_text != '':
        # perform SQL search using exact search string, i.e. no tokenizing

        # remove leading and trailing spaces and sql-escape single quotes as two single quotes
        search_text = search_text.strip().replace("'", "''")

        sql = 'SELECT * FROM "{table_name}" WHERE '.format(table_name=str(resource_view[u'resource_id']))

        context = {
            "model": model,
            "user": tk.g.user,
            "session": model.Session,
            "ignore_auth": True
        }

        where = '1=1'

        datastore_search = get_action(u'datastore_search_sql')
        unfiltered_response = datastore_search(
            None, {
                u"sql": sql + where,
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

        if '_full_text' in cols:    
           cols.remove( '_full_text' )

        sql = 'SELECT "{cols}" FROM "{table_name}" WHERE '.format(cols='","'.join(cols),table_name=str(resource_view[u'resource_id']))

        where = ''

        need_or = False

        for field in unfiltered_response['fields']:

            if need_or:
                where += 'OR '

            if field['type'] == 'text':
                where += '"{col}" ilike \'%{term}%\' '.format(col=field['id'], term=search_text)
                need_or = True
            elif field['type'] == 'numeric':
                # cast column using ::TEXT so that we can do an 'ilike' search
                # this way substring matches work on numeric types
                # For instance, string 0.01 will match on 0.01 and 0.011
                # If we used numeric comarison this wouldn't work
                where += '"{col}"::TEXT ilike \'%{term}%\' '.format(col=field['id'], term=search_text)
                need_or = True
            elif field['type'] == 'timestamp':
                # cast column using ::TEXT for similar reasons as above
                where += '"{col}"::TEXT ilike \'%{term}%\' '.format(col=field['id'], term=search_text)
                need_or = True

        sql += where

        response = datastore_search(
           context, {
                u"sql": sql,
                u"limit": 0,
                u"offset": offset,
                u"limit": limit,
                #u"sort": u', '.join(sort_list),
                u"filters": filters,
            }
        )

        response['total'] = len(response.get('records'))

    else:
        # This currently should never run but 
        # I've left it here in case we ever want to revert to 
        # Postgres 'Free Text Search' style search using the 
        # 'datastore_seach' endpoint

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


def filtered_download(resource_view_id):
    params = json.loads(request.form[u'params'])
    resource_view = get_action(u'resource_view_show'
                               )(None, {
                                   u'id': resource_view_id
                               })

    search_text = text_type(params[u'search'][u'value'])
    view_filters = resource_view.get(u'filters', {})
    user_filters = text_type(params[u'filters'])
    filters = merge_filters(view_filters, user_filters)

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
    for order in params[u'order']:
        sort_by_num = int(order[u'column'])
        sort_order = (u'desc' if order[u'dir'] == u'desc' else u'asc')
        sort_list.append(cols[sort_by_num] + u' ' + sort_order)

    cols = [c for (c, v) in zip(cols, params[u'visible']) if v]

    return h.redirect_to(
        h.
        url_for(u'datastore.dump', resource_id=resource_view[u'resource_id']) +
        u'?' + urlencode({
            u'q': search_text,
            u'sort': u','.join(sort_list),
            u'filters': json.dumps(filters),
            u'format': request.form[u'format'],
            u'fields': u','.join(cols),
        })
    )


datatablesview_plus.add_url_rule(
    u'/datatables/ajax/<resource_view_id>', view_func=ajax, methods=[u'POST']
)

datatablesview_plus.add_url_rule(
    u'/datatables/filtered-download/<resource_view_id>',
    view_func=filtered_download, methods=[u'POST']
)
