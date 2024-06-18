import json


def json_exception(type, message):
    return json.dumps({
        "exception": True,
        "exception_type": type,
        "exception_message": message
    })
