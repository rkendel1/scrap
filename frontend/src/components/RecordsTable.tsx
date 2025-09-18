import React, { useState } from 'react';
import { FormRecord } from '../types/api';

interface RecordsTableProps {
  records: FormRecord[];
  onDeleteRecord: (id: number) => void;
  onRefresh: () => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({ 
  records, 
  onDeleteRecord, 
  onRefresh 
}) => {
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderArrayPreview = (arr: any[], maxItems = 3) => {
    if (!Array.isArray(arr) || arr.length === 0) return 'None';
    
    const preview = arr.slice(0, maxItems);
    const remaining = arr.length - maxItems;
    
    return (
      <span>
        {preview.map((item, index) => (
          <span key={index} className="badge badge-secondary" style={{ marginRight: '4px' }}>
            {typeof item === 'string' ? item : typeof item === 'object' ? JSON.stringify(item).substring(0, 20) + '...' : String(item)}
          </span>
        ))}
        {remaining > 0 && <span className="badge badge-primary">+{remaining} more</span>}
      </span>
    );
  };

  const renderColorPalette = (colors: string[]) => {
    if (!Array.isArray(colors) || colors.length === 0) return 'None';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        {colors.slice(0, 5).map((color, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginRight: '8px', marginBottom: '4px' }}>
            <div
              className="color-swatch"
              style={{ backgroundColor: color }}
              title={color}
            ></div>
            <span style={{ fontSize: '12px', color: '#666' }}>{color}</span>
          </div>
        ))}
        {colors.length > 5 && (
          <span className="badge badge-primary">+{colors.length - 5} more</span>
        )}
      </div>
    );
  };

  const renderExpandedDetails = (record: FormRecord) => (
    <tr>
      <td colSpan={8}>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div className="grid grid-2" style={{ gap: '20px' }}>
            {/* Design Tokens */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#007bff' }}>Design Tokens</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <strong>Colors:</strong>
                <div style={{ marginTop: '8px' }}>
                  {renderColorPalette(record.color_palette)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Typography:</strong>
                <div style={{ marginTop: '8px' }}>
                  {renderArrayPreview(record.font_families)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Spacing (Margins):</strong>
                <div style={{ marginTop: '8px' }}>
                  {renderArrayPreview(record.margins)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Buttons:</strong>
                <div style={{ marginTop: '8px' }}>
                  {renderArrayPreview(record.buttons)}
                </div>
              </div>
            </div>

            {/* Components & Schema */}
            <div>
              <h4 style={{ marginBottom: '16px', color: '#28a745' }}>Components & Schema</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <strong>Form Fields:</strong>
                <div style={{ marginTop: '8px' }}>
                  {renderArrayPreview(record.form_fields)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>Form Schema:</strong>
                <div style={{ marginTop: '8px' }}>
                  {record.form_schema.length > 0 ? (
                    <div className="json-preview">
                      {JSON.stringify(record.form_schema, null, 2)}
                    </div>
                  ) : 'No forms found'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>CSS Variables:</strong>
                <div style={{ marginTop: '8px' }}>
                  {Object.keys(record.css_variables).length > 0 ? (
                    <div className="json-preview">
                      {JSON.stringify(record.css_variables, null, 2)}
                    </div>
                  ) : 'No CSS variables found'}
                </div>
              </div>
            </div>
          </div>

          {/* Preview HTML */}
          {record.preview_html && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '16px', color: '#6f42c1' }}>Preview HTML</h4>
              <div className="json-preview">
                {record.preview_html}
              </div>
            </div>
          )}

          {/* Raw CSS (truncated) */}
          {record.raw_css && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '16px', color: '#fd7e14' }}>Raw CSS (Preview)</h4>
              <div className="json-preview">
                {record.raw_css.substring(0, 500)}
                {record.raw_css.length > 500 && '...'}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  if (records.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <h3>No Records Found</h3>
          <p>Extract some website data to see records here.</p>
          <button onClick={onRefresh} className="btn btn-primary" style={{ marginTop: '16px' }}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Extracted Records ({records.length})</h2>
        <button onClick={onRefresh} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Title</th>
              <th>Colors</th>
              <th>Forms</th>
              <th>CSS Variables</th>
              <th>Extracted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <React.Fragment key={record.id}>
                <tr>
                  <td>
                    <a 
                      href={record.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#007bff', textDecoration: 'none' }}
                    >
                      {record.url.length > 30 ? record.url.substring(0, 30) + '...' : record.url}
                    </a>
                  </td>
                  <td>{record.title || 'No title'}</td>
                  <td>
                    <span className="badge badge-primary">
                      {record.color_palette.length} colors
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {record.form_schema.length} forms
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {Object.keys(record.css_variables).length} variables
                    </span>
                  </td>
                  <td>{formatDate(record.extracted_at)}</td>
                  <td>
                    <button
                      onClick={() => setExpandedRecord(
                        expandedRecord === record.id ? null : record.id
                      )}
                      className="btn btn-secondary"
                      style={{ marginRight: '8px', padding: '6px 12px', fontSize: '14px' }}
                    >
                      {expandedRecord === record.id ? 'Hide' : 'View'}
                    </button>
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedRecord === record.id && renderExpandedDetails(record)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};