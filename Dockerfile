FROM python:3.10

WORKDIR usr/src/vchess

COPY ./requirements.txt /usr/src/requirements.txt
RUN pip install -r /usr/src/requirements.txt

COPY . /usr/src/vchess

EXPOSE 8000

CMD cd VChessProject && \
    python manage.py makemigrations && \
    python manage.py migrate && \
    python manage.py loaddata VChessProject/fixtures/insert_default_db_records.json && \
    python manage.py collectstatic --noinput && \
    python manage.py runserver 0.0.0.0:8000