import React from 'react';
import { QueryEditorProps, DataSourceRef, DataSourceInstanceSettings } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';
import { DataSourcePicker } from '@grafana/runtime';
import { Input } from '@grafana/ui';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor (props: Props) {  
  const onDataSourceChange = (ref: DataSourceRef) => {
    const { onChange, query } = props;
    onChange({ ...query, datasource: ref, target_datasource: ref });
  };

    const { datasource} = props.query;

    return (
      <div className="gf-form">
      <DataSourcePicker
        placeholder="Select a data source"
        onChange={(newSettings: DataSourceInstanceSettings) => {
          onDataSourceChange({ type: newSettings.type, uid: newSettings.uid });
        }}
        noDefault={true}
        current={datasource?.uid !== "-- Mixed --" ? datasource : undefined}
      />
      <Input value={'test query' || ''} />
      </div>
    );
}
