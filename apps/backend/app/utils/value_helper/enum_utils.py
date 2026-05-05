def enum_value(value):
    if value is None:
        return None

    return value.value if hasattr(value, "value") else value

# Will return raw value for Enum fields.
# works whether SQLAlchemy returns: Enum object, POStatusEnum.APPROVED, string "APPROVED"