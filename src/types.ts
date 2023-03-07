import { DataQuery, DataSourceJsonData, DataSourceRef } from '@grafana/data';

export interface MyQuery extends DataQuery {
  method?: string;
  params: string;
  target_datasource: DataSourceRef;
}

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  backend?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
