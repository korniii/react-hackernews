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

const updateSearchTopStoriesState = (hits, page) => (prevState) => {
    const { searchKey, results } = prevState;
    const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
    const updatedHits = [ ...oldHits, ...hits ];

    return {
        results: {
            ...results,
            [searchKey]: { hits: updatedHits, page }
        },
        isLoading: false
    };
};

function App (){
    let _isMounted = false;

    const [isMounted, setIsMounted] = useState(false);
    const [results, setResults] = useState(null);
    const [searchKey, setSearchKey] = useState('');
    const [searchTerm, setSearchTerm] = useState(DEFAULT_QUERY);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        console.log('used effect');
        setSearchKey(searchTerm);
        fetchSearchTopStories(searchTerm);

        return function cleanup () {
            setIsMounted(false);
        }
    }, [isMounted])

    function needsToSearchTopStories(searchTerm) {
        return !this.state.results[searchTerm];
    }

    function fetchSearchTopStories(_searchTerm, page = 0) {
        setIsLoading(true);

        console.log(_searchTerm);
        axios.get(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${_searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
            .then(result => setSearchTopStories(result.data))
            .catch(error => setError(error));
    }

    function setSearchTopStories(result) {
        const { hits, page } = result;

        const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
        const updatedHits = [ ...oldHits, ...hits ];

        const updatedResults = {...results, [searchKey]: { hits: updatedHits, page }}
        setResults(updatedResults);
        setIsLoading(false)

    }

    function onSearchSubmit(event) {
        const { searchTerm } = this.state;
        this.setState({ searchKey: searchTerm });
        if (this.needsToSearchTopStories(searchTerm)) {
            this.fetchSearchTopStories(searchTerm);
        }
        event.preventDefault();
    }

    function onDismiss(id) {
        const { searchKey, results } = this.state;
        const { hits, page } = results[searchKey];

        const isNotId = item => item.objectID !== id;
        const updatedHits = hits.filter(isNotId);

        this.setState({
            results: {
                ...results, [searchKey]: { hits: updatedHits, page }
            }
        });
    }

    function onSearchChange(event) {
        this.setState({ searchTerm: event.target.value })
    }

    const page = (results && results[searchKey] && results[searchKey].page) || 0;
    const list = (results && results[searchKey] && results[searchKey].hits) || [];


    return(
        <div className="page">
            <div className="interactions">
                <Search value={searchTerm} onChange={() => onSearchChange()} onSubmit={() => onSearchSubmit()}>Search</Search>
                { error ? <div className="interactions"><p>Something went wrong.</p></div> : <Table list={list} onDismiss={() => onDismiss()}/> }
                <div className="interactions">
                    <ButtonWithLoading isLoading={isLoading} onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>More</ButtonWithLoading> }
                </div>
            </div>
        </div>
    )
}

const Search = ({ value,onChange,onSubmit,children }) => {
    let input;

    return (
        <form onSubmit={onSubmit}>
            <input type="text" value={value} onChange={onChange} ref={(node) => input = node }/>
            <button type="submit">{children}</button>
        </form>
    );
};


function Table (props){
    const [ sortKey, setSortKey ] = useState('NONE');
    const [ isSortReverse, setIsSortReverse] = useState(false);

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
                <span style={{width: '40%'}}>
                    <Sort onSort={() => onSort('TITLE')} activeSortKey={sortKey}>Title</Sort>
                </span>
                <span style={{width: '30%'}}>
                    <Sort onSort={() => onSort('AUTHOR')} activeSortKey={sortKey}>Author</Sort>
                </span>
                <span style={{width: '10%'}}>
                    <Sort onSort={() => onSort('COMMENTS')} activeSortKey={sortKey}>Comments</Sort>
                </span>
                <span style={{width: '10%'}}>
                    <Sort onSort={() => onSort('POINTS')} activeSortKey={sortKey}>Points</Sort>
                </span>
                <span style={{width: '10%'}}>
                    Archive
                </span>
            </div>

            {reverseSortedList.map(item =>
                <div key={item.objectID} className="table-row">
                <span style={{width: '40%'}}>
                    <a href={item.url}>{item.title}</a>
                </span>
                    <span style={{width: '30%'}}>{item.author}</span>
                    <span style={{width: '10%'}}>{item.num_comments}</span>
                    <span style={{width: '10%'}}>{item.points}</span>
                    <span style={{width: '10%'}}><Button onClick={() => onDismiss(item.objectID)}
                                                         className="button">Dismiss</Button></span>
                </div>
            )}
        </div>
    )
}


const Button = ({ onClick, className = '', children}) => {
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
    isLoading ? <Loading /> : <Component { ...rest } />;

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
