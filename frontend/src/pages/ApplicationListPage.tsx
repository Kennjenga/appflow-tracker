import React, { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDownUp, Filter, Download, Plus, Search, Clock, TrendingUp } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import ErrorMessage from '../components/ErrorMessage'
import StatusBadge from '../components/StatusBadge'

type Application = {
  id: number | string
  tracking_number?: string
  applicant_name?: string
  company_name?: string
  application_type?: string
  status?: string
  created_at?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export default function ApplicationListPage() {
  const navigate = useNavigate()
  const [globalFilter, setGlobalFilter] = useState<string>('')
  const [sorting, setSorting] = useState<any[]>([{ id: 'created_at', desc: true }])

  const query = useQuery({ queryKey: ['applications'], queryFn: applicationsApi.list })

  const data = (query.data as Application[]) || []

  const columns = useMemo(
    () => [
      {
        accessorKey: 'tracking_number',
        header: 'Tracking Number',
        cell: ({ row, getValue }: any) => (
          <Link
            className="table-link"
            to="/applications/$id"
            params={{ id: String((row.original as Application).id) } as any}
          >
            {getValue()}
          </Link>
        ),
      },
      { accessorKey: 'applicant_name', header: 'Applicant Name' },
      { accessorKey: 'company_name', header: 'Company Name' },
      { accessorKey: 'application_type', header: 'Type' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }: any) => <StatusBadge status={getValue()} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Created Date',
        cell: ({ getValue }: any) => formatDate(getValue()),
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns: columns as any,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const totalCount = data.length
  const pendingCount = data.filter(
    (a) => a.status === 'Under Review' || a.status === 'Submitted',
  ).length

  return (
    <div className="page-shell">
      {/* Page Header */}
      <section className="page-header">
        <div>
          <h1>Workflow Dashboard</h1>
          <p className="page-subtitle">
            Manage and track your global application lifecycle in real-time.
          </p>
        </div>
        <Link className="button button--primary button--pill" to="/applications/new">
          <Plus aria-hidden="true" size={18} />
          Create New Application
        </Link>
      </section>

      {/* Bento Grid Summaries */}
      <div className="bento-grid">
        <div className="bento-card">
          <div className="accent-bar accent-bar--primary" />
          <p className="bento-card__label">Active Workflows</p>
          <div className="bento-card__row">
            <span className="bento-card__value">
              {totalCount > 0 ? totalCount.toLocaleString() : '—'}
            </span>
            <span className="bento-card__badge">
              <TrendingUp size={12} />
              Active
            </span>
          </div>
          <div className="bento-card__progress">
            <div className="bento-card__progress-fill" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="bento-card">
          <div className="accent-bar accent-bar--tertiary" />
          <p className="bento-card__label">Pending Review</p>
          <div className="bento-card__row">
            <span className="bento-card__value">{pendingCount > 0 ? pendingCount : '—'}</span>
            <Clock size={22} className="bento-card__icon" />
          </div>
          <p className="bento-card__meta">Avg. wait time: 4.2 days</p>
        </div>
      </div>

      <ErrorMessage>{query.isError ? getApiErrorMessage(query.error) : ''}</ErrorMessage>

      {/* Application List Table */}
      <section className="table-surface" aria-busy={query.isLoading}>
        <div className="table-surface__header">
          <div className="table-surface__header-left">
            <h2>Application List</h2>
            <div className="filter-tab">
              <button className="filter-tab__item">All</button>
            </div>
          </div>
          <div className="table-surface__header-right">
            <label className="search-field search-field--inline">
              <Search aria-hidden="true" size={16} />
              <span className="sr-only">Search applications</span>
              <input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Search..."
              />
            </label>
            <button className="button button--ghost button--sm">
              <Filter size={14} /> Filter
            </button>
            <button className="button button--ghost button--sm">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {query.isLoading ? (
          <p className="empty-state">Loading applications...</p>
        ) : table.getRowModel().rows.length ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} scope="col">
                          <button
                            className="table-sort"
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowDownUp aria-hidden="true" size={14} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() =>
                        navigate({
                          to: '/applications/$id',
                          params: { id: String((row.original as Application).id) } as any,
                        })
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-surface__footer">
              <span>
                Showing 1 to {table.getRowModel().rows.length} of {data.length} entries
              </span>
              <div className="table-surface__footer-pagination">
                <button className="pagination-btn" disabled>
                  ‹
                </button>
                <span className="pagination-current">1</span>
                <button className="pagination-btn">›</button>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-state">No applications found.</p>
        )}
      </section>
    </div>
  )
}
