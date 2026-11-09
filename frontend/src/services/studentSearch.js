import { BehaviorSubject, Observable, Subject, of } from "rxjs";
import {
    catchError, debounceTime, distinctUntilChanged, map,
    shareReplay, startWith, switchMap
} from "rxjs/operators";

export function createStudentSearch(load, initialQuery, delay = 300) {
    const query$ = new BehaviorSubject(initialQuery);
    const reload$ = new Subject();
    const results$ = query$.pipe(
        debounceTime(delay),
        distinctUntilChanged((before, after) => JSON.stringify(before) === JSON.stringify(after)),
        switchMap(query => reload$.pipe(
            startWith(null),
            switchMap(() => new Observable(subscriber => {
                const controller = new AbortController();
                Promise.resolve().then(() => load(query, controller.signal)).then(result => {
                    subscriber.next(result);
                    subscriber.complete();
                }).catch(error => subscriber.error(error));
                return () => controller.abort();
            }).pipe(
                map(result => ({ ...result, loading: false, error: null, query })),
                catchError(error => of({ loading: false, error, query })),
                startWith({ loading: true, error: null, query })
            ))
        )),
        shareReplay({ bufferSize: 1, refCount: true })
    );

    return {
        results$,
        setQuery: query => query$.next({ ...query }),
        reload: () => reload$.next(null),
        destroy: () => { query$.complete(); reload$.complete(); }
    };
}
