import React, { useState } from 'react';

export default function ToolArgumentsForm({ result, onSubmit }) {
  const [values, setValues] = useState(() => Object.fromEntries(
    Object.entries(result?.provided_arguments || {}).map(([name, value]) => [
      name,
      value != null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
    ])
  ));
  const [error, setError] = useState('');
  const required = result?.argument_fields || result?.required_arguments || [];
  const properties = result?.input_schema?.properties || {};

  if (!required.length) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = {};
    try {
      for (const name of required) {
        const raw = values[name]?.trim();
        if (!raw) throw new Error(`Enter a value for ${name}.`);
        const definition = properties[name] || {};
        const type = Array.isArray(definition.type) ? definition.type[0] : definition.type;
        if (type === 'integer') {
          parsed[name] = Number(raw);
          if (!Number.isInteger(parsed[name])) throw new Error(`${name} must be a whole number.`);
        } else if (type === 'number') {
          parsed[name] = Number(raw);
          if (!Number.isFinite(parsed[name])) throw new Error(`${name} must be a number.`);
        } else if (type === 'boolean') {
          if (raw !== 'true' && raw !== 'false') throw new Error(`Choose true or false for ${name}.`);
          parsed[name] = raw === 'true';
        } else if (type === 'object' || type === 'array') {
          parsed[name] = JSON.parse(raw);
        } else {
          parsed[name] = raw;
        }
      }
      setError('');
      onSubmit(parsed);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="tool-arguments-form">
      <div className="tool-payload-title">TOOL INPUTS</div>
      {required.map((name) => {
        const definition = properties[name] || {};
        const type = Array.isArray(definition.type) ? definition.type[0] : definition.type || 'string';
        return (
          <label key={name} className="config-input-group">
            <span>{name}{definition.description ? ` — ${definition.description}` : ''}</span>
            {definition.enum ? (
              <select
                className="config-input"
                value={values[name] || ''}
                onChange={(event) => setValues(prev => ({ ...prev, [name]: event.target.value }))}
              >
                <option value="">Select…</option>
                {definition.enum.map(option => <option key={option} value={String(option)}>{String(option)}</option>)}
              </select>
            ) : type === 'boolean' ? (
              <select
                className="config-input"
                value={values[name] || ''}
                onChange={(event) => setValues(prev => ({ ...prev, [name]: event.target.value }))}
              >
                <option value="">Select…</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : type === 'object' || type === 'array' ? (
              <textarea
                className="config-input"
                placeholder={type === 'array' ? '["value"]' : '{"key":"value"}'}
                value={values[name] || ''}
                onChange={(event) => setValues(prev => ({ ...prev, [name]: event.target.value }))}
              />
            ) : (
              <input
                className="config-input"
                type={type === 'integer' || type === 'number' ? 'number' : 'text'}
                step={type === 'integer' ? '1' : type === 'number' ? 'any' : undefined}
                min={definition.minimum}
                max={definition.maximum}
                minLength={definition.minLength}
                maxLength={definition.maxLength}
                pattern={definition.pattern}
                value={values[name] || ''}
                onChange={(event) => setValues(prev => ({ ...prev, [name]: event.target.value }))}
              />
            )}
          </label>
        );
      })}
      {error && <div role="alert" className="tool-arguments-error">{error}</div>}
      <button type="submit" className="modal-btn primary">Run tool</button>
    </form>
  );
}
