from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class SignUpForm(UserCreationForm):
    username = forms.CharField(required=True, min_length=5, max_length=36,
                               widget=forms.TextInput(attrs={'class': 'input-field', 'placeholder': 'Login'}))
    email = forms.EmailField(required=True,
                             widget=forms.EmailInput(attrs={'class': 'input-field', 'placeholder': 'mail@gmail.com'}))
    password1 = forms.CharField(required=True,
                                widget=forms.PasswordInput(
                                    attrs={'class': 'input-field', 'placeholder': 'Password'}))
    password2 = forms.CharField(required=True,
                                widget=forms.PasswordInput(
                                    attrs={'class': 'input-field', 'placeholder': 'Confirm Password'}))

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
        widgets = {
            'email': forms.EmailInput(attrs={'class': 'input-field', 'placeholder': 'mail@gmail.com'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for fieldname in ['username', 'password1', 'password2']:
            self.fields[fieldname].help_text = None
