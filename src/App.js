import React, { Component, useState, useEffect } from 'react';
import axios from 'axios';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const SORTS = {
    NONE: list => list,
    TITLE: list => sortBy(list, 'title'),
    AUTHOR: list => sortBy(list, 'author'),
    COMMENTS: list => sortBy(list, 'num_comments').reverse(),
    POINTS: list => sortBy(list, 'points').reverse(),
};

function App() {
    const [results, setResults] = useState(null);
    const [searchKey, setSearchKey] = useState('');
    const [searchTerm, setSearchTerm] = useState(DEFAULT_QUERY);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log('use effect')

        fetchSearchTopStories(searchTerm);
    }, [searchKey])

    function needsToSearchTopStories(searchTerm) {
        return !results[searchTerm];
    }

    function fetchSearchTopStories(_searchTerm, page = 0) {
        setIsLoading(true);

        axios.get(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${_searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
            .then(result => setSearchTopStories(result.data))
            .catch(error => setError(error));
    }

    function setSearchTopStories(result) {
        const { hits, page } = result;

        const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
        const updatedHits = [...oldHits, ...hits];

        const updatedResults = { ...results, [searchKey]: { hits: updatedHits, page } }
        setResults(updatedResults);
        setIsLoading(false)

    }

    function onSearchSubmit(event) {
        setSearchKey(searchTerm);
        if (needsToSearchTopStories(searchTerm)) {
            fetchSearchTopStories(searchTerm);
        }
        event.preventDefault();
    }

    function onDismiss(id) {
        const { hits, page } = results[searchKey];

        const isNotId = item => item.objectID !== id;
        const updatedHits = hits.filter(isNotId);

        setResults({ ...results, [searchKey]: { hits: updatedHits, page } })
    }

    function onSearchChange(event) {
        setSearchTerm(event.target.value)
    }

    const page = (results && results[searchKey] && results[searchKey].page) || 0;
    const list = (results && results[searchKey] && results[searchKey].hits) || [];


    return (
        <div className="page">
            <div className="interactions">
                <Search value={searchTerm} onChange={(e) => onSearchChange(e)} onSubmit={onSearchSubmit}>Search</Search>
                {error ? <div className="interactions"><p>Something went wrong.</p></div> : <Table list={list} onDismiss={onDismiss} />}
                <div className="interactions">
                    <ButtonWithLoading isLoading={isLoading} onClick={() => fetchSearchTopStories(searchKey, page + 1)}>More</ButtonWithLoading>
                </div>
            </div>
        </div>
    )
}

const Search = ({ value, onChange, onSubmit, children }) => {
    let input;

    return (
        <form onSubmit={onSubmit}>
            <input type="text" value={value} onChange={onChange} ref={(node) => input = node} />
            <button type="submit">{children}</button>
        </form>
    );
};


function Table(props) {
    const [sortKey, setSortKey] = useState('NONE');
    const [isSortReverse, setIsSortReverse] = useState(false);

    function onSort(_sortKey) {
        const _isSortReverse = _sortKey === sortKey && !isSortReverse;
        setSortKey(_sortKey);
        setIsSortReverse(_isSortReverse);
    }

    const { list, onDismiss, } = props;

    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse ? sortedList.reverse() : sortedList;

    return (
        <div className="table">
            <div className="table-header">
                <span style={{ width: '40%' }}>
                    <Sort onSort={() => onSort('TITLE')} activeSortKey={sortKey}>Title</Sort>
                </span>
                <span style={{ width: '30%' }}>
                    <Sort onSort={() => onSort('AUTHOR')} activeSortKey={sortKey}>Author</Sort>
                </span>
                <span style={{ width: '10%' }}>
                    <Sort onSort={() => onSort('COMMENTS')} activeSortKey={sortKey}>Comments</Sort>
                </span>
                <span style={{ width: '10%' }}>
                    <Sort onSort={() => onSort('POINTS')} activeSortKey={sortKey}>Points</Sort>
                </span>
                <span style={{ width: '10%' }}>
                    Archive
                </span>
            </div>

            {reverseSortedList.map(item =>
                <div key={item.objectID} className="table-row">
                    <span style={{ width: '40%' }}>
                        <a href={item.url}>{item.title}</a>
                    </span>
                    <span style={{ width: '30%' }}>{item.author}</span>
                    <span style={{ width: '10%' }}>{item.num_comments}</span>
                    <span style={{ width: '10%' }}>{item.points}</span>
                    <span style={{ width: '10%' }}><Button onClick={() => onDismiss(item.objectID)}
                        className="button">Dismiss</Button></span>
                </div>
            )}
        </div>
    )
}


const Button = ({ onClick, className = '', children }) => {
    return (
        <button
            onClick={onClick}
            className={className}
            type="button"
        >
            {children}
        </button>
    );
};


const Loading = () =>
    <div>Loading ...</div>;

const withLoading = (Component) => ({ isLoading, ...rest }) =>
    isLoading ? <Loading /> : <Component {...rest} />;

const ButtonWithLoading = withLoading(Button);

const Sort = ({ sortKey, activeSortKey, onSort, children }) => {
    const sortClass = classNames(
        'button-inline',
        { 'button-active': sortKey === activeSortKey }
    );

    return (
        <Button onClick={() => onSort(sortKey)} className={sortClass}>{children}</Button>
    )
};

export default App;

export {
    Button,
    Search,
    Table,
};
