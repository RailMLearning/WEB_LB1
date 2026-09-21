import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class Student(BaseModel):
	isu: str = Field(pattern=r"^\d{5,7}$")
	fio: str = Field(max_length=150)
	grid: str = Field(pattern=r"^[A-Z]\d{4}[a-z]?$")
	dnum: int = Field(ge=1)
	rnum: int = Field(ge=1)
	expdate: str
	foreigner: bool
	notes: str = Field(default="", max_length=500)

	@field_validator("fio")
	@classmethod
	def validate_fio(cls, value: str) -> str:
		pattern = r"^[^\W\d_][^\W\d_'’\-]*(?:\s+[^\W\d_][^\W\d_'’\-]*)*$"
		if not re.fullmatch(pattern, value, re.UNICODE):
			raise ValueError("Введите фамилию и имя или одно слово буквами. Допустимы дефис и апостроф, максимум 150 символов.")
		return value

	@field_validator("expdate")
	@classmethod
	def validate_expdate(cls, value: str) -> str:
		if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
			raise ValueError("Дата должна быть существующей календарной датой в диапазоне от 01.01.1900 до 31.12.9999.")
		try:
			parsed = datetime.strptime(value, "%Y-%m-%d")
		except ValueError as error:
			raise ValueError("Дата должна быть существующей календарной датой в диапазоне от 01.01.1900 до 31.12.9999.") from error
		if not 1900 <= parsed.year <= 9999:
			raise ValueError("Дата должна быть существующей календарной датой в диапазоне от 01.01.1900 до 31.12.9999.")
		return value