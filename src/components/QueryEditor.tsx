import React, { ChangeEvent, useEffect, useState } from 'react';
import { QueryEditorProps, DataSourceRef, DataSourceInstanceSettings } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';
import { DataSourcePicker } from '@grafana/runtime';
import { TextArea, Field, InlineFieldRow, InlineField, Cascader } from '@grafana/ui';


type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor (this: any, props: Props) {
  const [options, setOptions] = useState([]);
  const onDataSourceChange = (ref: DataSourceRef) => {
    const { onChange, query } = props;
    onChange({ ...query, datasource: ref, target_datasource: ref });
  };

  const onParamsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { onChange, query } = props;
    onChange({ ...query, params: event.target.value });
    // props.onRunQuery();
  };
  useEffect(() => {
    const url = "http://localhost:3456/api/list";
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        setOptions(json);
      } catch (error) {
        console.log("error", error);
      }
    };
    fetchData();
  }, []);
  const { datasource, params } = props.query;
  const onSelect = (val: string) => {
    const { onChange, query } = props;
    onChange({ ...query, method: val });
    props.onRunQuery();
  };

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
          <Cascader options={options} onSelect={onSelect}/>
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
