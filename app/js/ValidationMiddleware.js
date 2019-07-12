const { Joi, celebrate } = require('celebrate')

module.exports = { validate }

function validate(schema) {
  let finalSchema = schema
  if (schema.body != null) {
    finalSchema = {
      ...schema,
      body: schema.body.append({
        _csrf: Joi.string().allow('')
      })
    }
  }
  return celebrate(finalSchema)
}
