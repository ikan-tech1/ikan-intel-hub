"""
Ikan NLP service — FastAPI microservice for the heavier-than-Node text tasks.

Endpoints:
  POST /readability    extract main article text from raw HTML
  POST /phones         normalize phone numbers via libphonenumber
  GET  /health         liveness

Deployed on Fly.io as a small Python container (see infra/fly.nlp.toml).
The TS worker calls these endpoints during the extract-AI step of the
scrape pipeline.
"""

from __future__ import annotations

from typing import Optional

import phonenumbers
from fastapi import FastAPI
from pydantic import BaseModel
from readability import Document

app = FastAPI(title="Ikan NLP", version="0.1.0")


class ReadabilityIn(BaseModel):
    html: str


class ReadabilityOut(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None


@app.post("/readability", response_model=ReadabilityOut)
async def readability(input: ReadabilityIn) -> ReadabilityOut:
    doc = Document(input.html)
    return ReadabilityOut(
        title=doc.short_title() or "",
        content=doc.summary(html_partial=True),
    )


class PhoneIn(BaseModel):
    raw: str
    region: str = "IN"


class PhoneOut(BaseModel):
    valid: bool
    e164: Optional[str] = None
    region: Optional[str] = None
    line_type: Optional[str] = None


@app.post("/phones", response_model=PhoneOut)
async def phones(input: PhoneIn) -> PhoneOut:
    try:
        num = phonenumbers.parse(input.raw, input.region)
    except phonenumbers.NumberParseException:
        return PhoneOut(valid=False)
    if not phonenumbers.is_valid_number(num):
        return PhoneOut(valid=False)
    return PhoneOut(
        valid=True,
        e164=phonenumbers.format_number(num, phonenumbers.PhoneNumberFormat.E164),
        region=phonenumbers.region_code_for_number(num),
        line_type=str(phonenumbers.number_type(num)),
    )


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}
