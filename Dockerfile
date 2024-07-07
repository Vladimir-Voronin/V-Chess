FROM python:3.10

WORKDIR usr/src/vchess

COPY ./requirements.txt /usr/src/requirements.txt
RUN pip install -r /usr/src/requirements.txt

COPY . /usr/src/vchess

EXPOSE 8000

CMD ["python", "VChessProject/manage.py", "runserver", "0.0.0.0:8000"]