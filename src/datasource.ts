import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  DataSourceApi,
  LoadingState
} from '@grafana/data';
import { DataSourceWithBackend, getDataSourceSrv, toDataQueryError } from '@grafana/runtime';
import { cloneDeep } from 'lodash';

import { MyQuery, MyDataSourceOptions } from './types';
import { forkJoin, from, Observable, of, OperatorFunction } from 'rxjs';
import { catchError, map, mergeAll, mergeMap, reduce, toArray } from 'rxjs/operators';

export interface BatchedQueries {
  datasource: Promise<DataSourceApi>;
  targets: MyQuery[];
}

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  jsonData: any;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.jsonData = instanceSettings.jsonData;
  }

  query(request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const queries = request.targets.filter((t) => {
      return t.target_datasource?.type !== 'svtech-anomalydetection-datasource' && t.target_datasource != null;
    });
    if (!queries.length) {
      return of({ data: [] }); // nothing
    }
    queries.forEach(function(v){ delete v.datasource; v.datasource =  v.target_datasource;});
    const mixed: BatchedQueries[] = [];
    queries.forEach((query, i) => {
      mixed.push({
          datasource: getDataSourceSrv().get(query.target_datasource, request.scopedVars),
          targets: [query]
      });
    });
    // return of({ data: [] });
    let result = this.batchQueries(mixed, request);
    return result;
  }

  getBackend() {
    return this.jsonData.backend;
  }

  batchQueries(mixed: BatchedQueries[], request: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const queries_anomaly_backend = request.targets.filter((t) => {
      return t.target_datasource?.type === 'svtech-anomalydetection-datasource' || t.target_datasource == null;
    });
    const runningQueries = mixed.filter(this.isQueryable).map((query, i) =>
      from(query.datasource).pipe(
        mergeMap((api: DataSourceApi) => {
          const dsRequest = cloneDeep(request);
          dsRequest.requestId = `mixed-${i}-${dsRequest.requestId || ''}`;
          dsRequest.targets = query.targets;

          return from(api.query(dsRequest)).pipe(
            map((response) => {
              return {
                ...response,
                data: response.data || [],
                state: LoadingState.Loading,
                key: `mixed-${i}-${response.key || ''}`,
              };
            }),
            toArray(),
            catchError((err) => {
              err = toDataQueryError(err);
              err.message = `${api.name}: ${err.message}`;

              return of<DataQueryResponse[]>([
                {
                  data: [],
                  state: LoadingState.Error,
                  error: err,
                  key: `mixed-${i}-${dsRequest.requestId || ''}`,
                },
              ]);
            })
          );
        })
      )
    );
    
    return forkJoin(runningQueries).pipe(flattenResponses(), map(this.finalizeResponses), map(n => this.generateAlarm(n, queries_anomaly_backend)), mergeAll());
  }

  generateAlarm(responses: DataQueryResponse[], queries: MyQuery[]): DataQueryResponse[] {
    const refIDs: string[] = [];
    if (queries.length === 0) {
      // If there is no query to generate anomaly
      return responses;
    } else {
      for (let i = 0; i < queries.length; i++) {
        if (queries[i].series !== null) {
          // Get all refid need to perform
          refIDs.push(queries[i].series);
        }
      }
      // To do: async for each refID
      // Send all data to backend - Start
      const query_alarm = responses.filter((t) => {
        return refIDs.includes(t.data[0].refId);
      })
      // Send all data to backend - End
      fetch(this.jsonData.backend + '/anomalies', {
        method: 'POST',
        body: JSON.stringify(query_alarm),
      }).then(res => {
        return res.json();
      }).then(data => {
        data.error = false;
        responses.push((data as DataQueryResponse));
      });
      console.log(responses);
      return responses;
    }
  }

  private isQueryable(query: BatchedQueries): boolean {
    return query && Array.isArray(query.targets) && query.targets.length > 0;
  }

  private finalizeResponses(responses: DataQueryResponse[]): DataQueryResponse[] {
    const { length } = responses;

    if (length === 0) {
      return responses;
    }

    const error = responses.find((response) => response.state === LoadingState.Error);
    if (error) {
      responses.push(error); // adds the first found error entry so error shows up in the panel
    } else {
      responses[length - 1].state = LoadingState.Done;
    }

    return responses;
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}

function flattenResponses(): OperatorFunction<DataQueryResponse[][], DataQueryResponse[]> {
  return reduce((all: DataQueryResponse[], current) => {
    return current.reduce((innerAll, innerCurrent) => {
      innerAll.push.apply(innerAll, innerCurrent);
      return innerAll;
    }, all);
  }, []);
}
