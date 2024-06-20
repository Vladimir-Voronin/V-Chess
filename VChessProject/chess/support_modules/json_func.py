import json


def json_exception(type, message):
    return json.dumps({
        "type": "exception",
        "exception_type": type,
        "exception_message": message
    })
