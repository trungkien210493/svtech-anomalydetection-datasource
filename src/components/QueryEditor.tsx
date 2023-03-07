import React, { ChangeEvent, useEffect } from 'react';
import { QueryEditorProps, DataSourceRef, DataSourceInstanceSettings } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';
import { DataSourcePicker } from '@grafana/runtime';
import { LegacyForms, TextArea, Field, InlineFieldRow, InlineField } from '@grafana/ui';


const { FormField } = LegacyForms;
type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor (this: any, props: Props) {  
  const onDataSourceChange = (ref: DataSourceRef) => {
    const { onChange, query } = props;
    onChange({ ...query, datasource: ref, target_datasource: ref });
  };

  const onMethodChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    onChange({ ...query, method: event.target.value });
    // props.onRunQuery();
  };

  const onParamsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { onChange, query } = props;
    onChange({ ...query, params: event.target.value });
    // props.onRunQuery();
  };
  useEffect(() => {
    const url = "https://api.adviceslip.com/advice";

    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        console.log(json);
      } catch (error) {
        console.log("error", error);
      }
    };

    fetchData();
  }, []);
  const { datasource, method, params } = props.query;

  return (
    <div>
      <InlineFieldRow>
        <InlineField>
          <DataSourcePicker
            placeholder="Select a data source"
            onChange={(newSettings: DataSourceInstanceSettings) => {
              onDataSourceChange({ type: newSettings.type, uid: newSettings.uid });
            }}
            noDefault={true}
            current={datasource?.uid !== "-- Mixed --" ? datasource : undefined}
          />
        </InlineField>
        <InlineField>
          <FormField
            labelWidth={8}
            value={method || ''}
            onChange={onMethodChange}
            label="Method"
            tooltip="Detection Algorithm"
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField>
          <Field label="Params" description="Params to tuning algorithm">
            <TextArea
              value={params || ''}
              onChange={onParamsChange}
              label="Param"
            />
          </Field>
          </InlineField>
        </InlineFieldRow>
    </div>
  );
}
