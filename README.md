# ckanext-datatablesview_plus

This is a fork of the core ckanext-datatables extension with DataTables upgraded to 
versin 1.12.1 and styling and functionality configured for the Texas Water Data Hub


## Requirements

Compatibility with core CKAN versions:

| CKAN version    | Compatible?   |
| --------------- | ------------- |
| 2.6 and earlier | not tested    |
| 2.7             | not tested    |
| 2.8             | not tested    |
| 2.9             | yes           |

## Installation

To install ckanext-datatablesview_plus:

1. Activate your CKAN virtual environment, for example:

     ```
     . /usr/lib/ckan/default/bin/activate
     ```
     
2. Clone the source and install it on the virtualenv

    ```
    git clone https://github.com/TNRIS/ckanext-datatablesview_plus.git
    cd ckanext-datatablesview_plus
    pip install -e .
    pip install -r requirements.txt
    ```
3. Add `datatablesview_plus` to the `ckan.plugins` setting in your CKAN
   config file (by default the config file is located at
   `/etc/ckan/default/ckan.ini`).

4. Add `datatablesview_plus` to the `ckan.ciews.default_views` setting in your CKAN
   config file (by default the config file is located at
   `/etc/ckan/default/ckan.ini`).


5. Restart CKAN. For example if you've deployed CKAN with Apache on Ubuntu:
    ```
    sudo service apache2 reload
    ```

6. Create the DB table used to store 'Share Search' data.

    ```
    ckan -c ckan.ini datatablesview-plus migrate
    ```

## Developer installation

To install ckanext-datatablesview_plus for development, activate your CKAN virtualenv and
do:
    ```
    git clone https://github.com/twdbben/ckanext-datatablesview_plus.git
    cd ckanext-datatablesview_plus
    python setup.py develop
    pip install -r dev-requirements.txt
    ```
