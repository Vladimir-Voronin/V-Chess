class LoggerMiddleWare:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"Request: {request}")

        response = self.get_response(request)

        print(f"Response: {response}")
        return response
