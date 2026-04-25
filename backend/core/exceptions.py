from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404


def custom_exception_handler(exc, context):
    # Django-ning o'z exceptionlarini DRF formatiga o'tkazish
    if isinstance(exc, DjangoValidationError):
        from rest_framework.exceptions import ValidationError
        exc = ValidationError(detail=exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)

    if isinstance(exc, Http404):
        from rest_framework.exceptions import NotFound
        exc = NotFound()

    response = exception_handler(exc, context)

    if response is not None:
        code = getattr(exc, 'default_code', 'error')
        if hasattr(exc, 'detail') and isinstance(exc.detail, dict):
            message = 'Noto\'g\'ri ma\'lumotlar'
            errors  = exc.detail
        else:
            detail  = getattr(exc, 'detail', str(exc))
            message = str(detail) if not isinstance(detail, (list, dict)) else 'Xato yuz berdi'
            errors  = detail if isinstance(detail, (list, dict)) else None

        response.data = {
            'success': False,
            'code':    code.upper() if isinstance(code, str) else 'ERROR',
            'message': message,
            'errors':  errors,
        }

    return response
