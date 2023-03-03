import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  DataSourceApi
} from '@grafana/data';
import { DataSourceWithBackend, getDataSourceSrv } from '@grafana/runtime';
import { groupBy } from 'lodash';

import { MyQuery, MyDataSourceOptions } from './types';
import { Observable, of } from 'rxjs';

export interface BatchedQueries {
  datasource: Promise<DataSourceApi>;
  targets: MyQuery[];
}

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const queries = request.targets.filter((t) => {
      return t.datasource?.uid !== '-- Mixed --';
    });
    if (!queries.length) {
      return of({ data: [] }); // nothing
    }
    const sets: { [key: string]: MyQuery[] } = groupBy(queries, 'datasource.uid');
    const mixed: BatchedQueries[] = [];
    console.log(sets)
    for (const key in sets) {
      const targets = sets[key];

      mixed.push({
        datasource: getDataSourceSrv().get(targets[0].datasource, request.scopedVars),
        targets,
      });
    }

    // Missing UIDs?
    if (!mixed.length) {
      return of({ data: [] }); // nothing
    }
    console.log(mixed);
    return new Observable<DataQueryResponse>();
  }



  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
