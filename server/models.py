import re
import unicodedata
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from server.formatter import format_student


class StudentValidation(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    @model_validator(mode="before")
    @classmethod
    def format_values(cls, data):
        return format_student(data) if isinstance(data, dict) else data

    @field_validator("isu", mode="before", check_fields=False)
    @classmethod
    def validate_isu(cls, value):
        if not isinstance(value, str) or not re.fullmatch(r"[0-9]{5,7}", value):
            raise ValueError("ИСУ ID должен содержать от 5 до 7 цифр.")
        return value

    @field_validator("fio", mode="before", check_fields=False)
    @classmethod
    def validate_fio(cls, value):
        message = "Введите фамилию и имя или одно слово буквами. Допустимы дефис и апостроф, максимум 150 символов."
        if not isinstance(value, str) or not value or len(value) > 150:
            raise ValueError(message)
        for word in value.split(" "):
            if not word or not unicodedata.category(word[0]).startswith("L"):
                raise ValueError(message)
            if any(unicodedata.category(char)[0] not in ("L", "M") and char not in "'’-" for char in word):
                raise ValueError(message)
        return value

    @field_validator("grid", mode="before", check_fields=False)
    @classmethod
    def validate_group(cls, value):
        if not isinstance(value, str) or not re.fullmatch(r"[A-Z][0-9]{4}[a-z]?", value):
            raise ValueError("Группа должна иметь формат: заглавная латинская буква, 4 цифры и необязательная строчная буква.")
        return value

    @field_validator("dnum", "rnum", mode="before", check_fields=False)
    @classmethod
    def validate_number(cls, value):
        message = "Номер должен быть положительным целым числом."
        if isinstance(value, str) and re.fullmatch(r"[0-9]+", value):
            value = value.lstrip("0") or "0"
            if len(value) > 16:
                raise ValueError(message)
            value = int(value)
        if type(value) is not int or not 1 <= value <= 9007199254740991:
            raise ValueError(message)
        return value

    @field_validator("expdate", mode="before", check_fields=False)
    @classmethod
    def validate_date(cls, value):
        message = "Дата должна быть существующей календарной датой в диапазоне от 01.01.1900 до 31.12.9999."
        if not isinstance(value, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value):
            raise ValueError(message)
        try:
            date = datetime.strptime(value, "%Y-%m-%d")
        except ValueError as error:
            raise ValueError(message) from error
        if date.year < 1900:
            raise ValueError(message)
        return value

    @field_validator("foreigner", mode="before", check_fields=False)
    @classmethod
    def validate_foreigner(cls, value):
        if value is True or value == "true":
            return True
        if value is False or value == "false":
            return False
        raise ValueError("Поле должно иметь значение true или false.")

    @field_validator("notes", mode="before", check_fields=False)
    @classmethod
    def validate_notes(cls, value):
        if not isinstance(value, str) or len(value) > 500:
            raise ValueError("Заметки не должны превышать 500 символов.")
        return value


class StudentCreate(StudentValidation):
    isu: str = Field(pattern=r"^[0-9]{5,7}$")
    fio: str = Field(min_length=1, max_length=150)
    grid: str = Field(pattern=r"^[A-Z][0-9]{4}[a-z]?$")
    dnum: int = Field(gt=0, le=9007199254740991)
    rnum: int = Field(gt=0, le=9007199254740991)
    expdate: str = Field(pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
    foreigner: bool
    notes: str = Field(default="", max_length=500)


class StudentUpdate(StudentCreate):
    isu: str = Field(default=None, pattern=r"^[0-9]{5,7}$")
    fio: str = Field(default=None, min_length=1, max_length=150)
    grid: str = Field(default=None, pattern=r"^[A-Z][0-9]{4}[a-z]?$")
    dnum: int = Field(default=None, gt=0, le=9007199254740991)
    rnum: int = Field(default=None, gt=0, le=9007199254740991)
    expdate: str = Field(default=None, pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
    foreigner: bool = Field(default=None)
    notes: str = Field(default=None, max_length=500)
