from pathlib import Path
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import TemplateView, FormView

from .forms import SignUpForm


def base_page(request):
    return render(request, Path("chess/base/base.html"))


class DefaultLayoutView(TemplateView):
    template_name = "chess/default_layout.html"


class SignUpView(FormView):
    form_class = SignUpForm
    template_name = Path("chess/sign_up.html")

    def get_success_url(self):
        return reverse('chess:home_page')

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        user = form.save()
        return super().form_valid(form)
