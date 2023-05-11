import re


def convert_type(type, value):
    #Convert according the type
    if type == 'num':
        return value
    elif type in ['string', 'date']:
        return f"'{value}'"

def cond_less_than(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    value = convert_type(node.type, node.values['1'])
    return '"{}" < {}'.format(node.data, value)

def cond_greater_than(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    value = convert_type(node.type, node.values['1'])
    return '"{}"> {}'.format(node.data, value)

def cond_equals(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    value = convert_type(node.type, node.values['1'])
    return '"{}" = {}'.format(node.data, value)

def cond_not_equals(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    value = convert_type(node.type, node.values['1'])
    return '"{}" != {}'.format(node.data, value)

def cond_starts(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    return "\"{}\" ilike '{}%'".format(node.data, node.values['1'])

def cond_not_starts(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    return "\"{}\" not ilike '{}%'".format(node.data, node.values['1'])

def cond_contains(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    return "\"{}\" ilike '%{}%'".format(node.data, node.values['1'])

def cond_not_contains(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    return "\"{}\" not ilike '%{}%'".format(node.data, node.values['1'])

def cond_ends(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    return "\"{}\" ilike '%{}'".format(node.data, node.values['1'])

def cond_not_ends(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    return "\"{}\" not ilike '%{}'".format(node.data, node.values['1'])

def cond_between(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 2 and ('1' not in node.values or '2' not in node.values):
        raise Exception('Parse excepion: expected to have exactly 2 values for the between condition')
    value = convert_type(node.type, node.values['1'])
    value2 = convert_type(node.type, node.values['2'])
    return '"{}" between {} and {}'.format(node.data, value, value2)

def cond_is_not_between(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 2 and ('1' not in node.values or '2' not in node.values):
        raise Exception('Parse excepion: expected to have exactly 2 values for the between condition')
    value = convert_type(node.type, node.values['1'])
    value2 = convert_type(node.type, node.values['2'])
    return '"{}" not between {} and {}'.format(node.data, value, value2)

def cond_is_null(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    return "{} is null".format(node.data)

def cond_is_not_null(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    return "{} is not null".format(node.data)

def cond_greater_than_or_equal(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    value = convert_type(node.type, node.values['1'])
    return '"{}" >= {}'.format(node.data, value)

def cond_less_than_or_equal(node):
    # Validate first
    if not node.data:
        raise Exception('Parse excepion: expected the data column to be specified')
    if len(node.values) != 1 and '1' not in node.values:
        raise Exception('Parse excepion: expected the value to be specified')
    value = convert_type(node.type, node.values['1'])
    return '"{}" <= {}'.format(node.data, value)


CONDITIONS = {
    '<': cond_less_than,
    '>': cond_greater_than,
    '=': cond_equals,
    '!=': cond_not_equals,
    '>=': cond_greater_than_or_equal,
    '<=': cond_less_than_or_equal,
    'starts': cond_starts,
    '!starts': cond_not_starts,
    'contains': cond_contains,
    '!contains': cond_not_contains,
    'ends': cond_ends,
    '!ends': cond_not_ends,
    'between': cond_between,
    '!between': cond_is_not_between,
    'null': cond_is_null,
    '!null': cond_is_not_null,
}

class Node:

    def __init__(self, is_root=False):
        self.condition = None
        self.data = None
        self.type = None
        self.logic = None
        self.is_root = is_root
        self.values = {}
        self.chidlren = {}

    def get_child(self, key):
        if not key:
            raise Exception('empty child key')
        if key[0] == 'logic':
            return self
        if key[0] == 'criteria':
            # lookup children
            if len(key) < 2:
                raise Exception('Invalid key: {}'.format(key))
            child_idx = key[1]
            if child_idx not in self.chidlren:
                # create child
                self.chidlren[child_idx] = Node()
            return self.chidlren[child_idx].get_child(key[2:])
        else:
            # we're lookig for a particular property of this object
            return self

    def set_prop(self, prop, value):
        if prop == 'logic':
            self.logic = value
        elif prop == 'condition':
            self.condition = value
        elif prop == 'data':
            self.data = value
        elif prop == 'type':
            self.type = value
        elif prop.startswith('value'):
            self.values[prop.lstrip('value')] = value
        else:
            raise Exception('unknown prop to set: {} => {}'.format(prop, value))

    def to_sql(self):
        if self.logic:
            # we're expecting to have some children here
            if not len(self.chidlren):
                raise Exception('Parse excepetion: malformed expression')
            expressions = []
            for child_id in sorted(self.chidlren.keys()):
                child = self.chidlren[child_id]
                expressions.append(child.to_sql())
            if len(expressions) > 1:
                return '(' + ' {} '.format(self.logic).join(expressions) + ')'
            return expressions[0]
        # not a container of logical operator
        cond_fn = CONDITIONS.get(self.condition)
        if not cond_fn:
            raise Exception('Unsupported condition: {}'.format(self.condition))
        return cond_fn(self)

    def print_tree(self, lvl=0):
        pref = '    ' * lvl
        print(pref, 'logic {}'.format(self.logic))
        print(pref, ' - data: {}'.format(self.data))
        print(pref, ' - type: {}'.format(self.type))
        print(pref, ' - condition: {}'.format(self.condition))
        print(pref, ' - values: {}'.format(self.values))
        print(pref, ' - children:')
        for child_id in sorted(self.chidlren.keys()):
            print('    '*(lvl+1), '{}:'.format(child_id))
            self.chidlren[child_id].print_tree(lvl=lvl+1)

def parse(tokens):
    root = Node()
    for key, value in _clear_repeated_values(tokens):
        tokenized_key = _parse_key(key)
        node = root.get_child(tokenized_key)
        node.set_prop(tokenized_key[-1], value)
    return root

def _clear_repeated_values(tokens):
    return [(k.strip(), v) for k,v in tokens if not k.strip().endswith('[]')]

def _parse_key(key):
    return re.findall(r'\[([^\[\]]+)\]', key)