import React, { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDownUp, Filter, Download, Plus, Search, Clock, TrendingUp } from 'lucide-react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
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

  const search = useSearch({ strict: false }) as { status?: string }
  const statusFilter = search.status

  const query = useQuery({ queryKey: ['applications'], queryFn: applicationsApi.list })

  const data = (query.data as Application[]) || []

  const filteredData = useMemo(() => {
    if (!statusFilter) return data
    if (statusFilter === 'Draft') {
      return data.filter((a) => a.status === 'Draft')
    }
    if (statusFilter === 'Pending') {
      return data.filter(
        (a) =>
          a.status === 'Submitted' ||
          a.status === 'Under Review' ||
          a.status === 'Need More Information',
      )
    }
    if (statusFilter === 'Completed') {
      return data.filter((a) => a.status === 'Approved' || a.status === 'Rejected')
    }
    return data
  }, [data, statusFilter])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'tracking_number',
        header: 'Tracking Number',
        cell: ({ row, getValue }: any) => (
          <Link
            className="text-primary font-semibold hover:underline"
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
    data: filteredData,
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

  const activeFilterLabel = useMemo(() => {
    if (!statusFilter) return 'All'
    if (statusFilter === 'Pending') return 'Pending Review'
    return statusFilter
  }, [statusFilter])

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-[28px] leading-9 font-semibold text-on-surface tracking-tight m-0">
            Workflow Dashboard
          </h1>
          <p className="text-base text-on-surface-variant mt-1 leading-relaxed">
            Manage and track your global application lifecycle in real-time.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 min-h-[40px] font-semibold text-sm rounded-full px-6 bg-primary text-white hover:bg-primary-strong active:scale-95 transition-all shadow-sm hover:shadow-soft"
          to="/applications/new"
        >
          <Plus aria-hidden="true" size={18} />
          Create New Application
        </Link>
      </section>

      {/* Bento Grid Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="relative bg-white border border-outline-variant p-6 rounded-lg overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant m-0">
            Active Workflows
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-[36px] leading-11 font-bold text-on-surface tracking-tight">
              {totalCount > 0 ? totalCount.toLocaleString() : '—'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-secondary-container text-primary">
              <TrendingUp size={12} />
              Active
            </span>
          </div>
          <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden mt-4">
            <div className="h-full bg-primary" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="relative bg-white border border-outline-variant p-6 rounded-lg overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />
          <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant m-0">
            Pending Review
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-[36px] leading-11 font-bold text-on-surface tracking-tight">
              {pendingCount > 0 ? pendingCount : '—'}
            </span>
            <Clock size={22} className="text-tertiary" />
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">Avg. wait time: 4.2 days</p>
        </div>
      </div>

      <ErrorMessage>{query.isError ? getApiErrorMessage(query.error) : ''}</ErrorMessage>

      {/* Application List Table */}
      <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden" aria-busy={query.isLoading}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold m-0">Application List</h2>
            <div className="flex border border-outline-variant rounded p-1 bg-surface-container-low">
              <button
                className="px-3 py-1 bg-white rounded shadow-sm text-xs font-semibold text-primary border-none cursor-pointer"
                onClick={() => navigate({ to: '/', search: { status: undefined } })}
              >
                {activeFilterLabel}
              </button>
              {statusFilter && (
                <button
                  className="px-2 bg-transparent border-none text-outline text-xs cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate({ to: '/', search: { status: undefined } })}
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2.5 w-full md:w-[200px] min-h-[36px] px-3 bg-surface border border-outline-variant rounded text-sm text-on-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <Search aria-hidden="true" size={16} className="text-outline" />
              <span className="sr-only">Search applications</span>
              <input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Search..."
                className="w-full border-0 outline-0 bg-transparent"
              />
            </label>
            <button className="inline-flex items-center justify-center gap-2 min-h-[36px] font-semibold text-xs rounded px-3 border border-outline-variant text-secondary bg-transparent hover:bg-surface-container-low transition-colors">
              <Filter size={14} /> Filter
            </button>
            <button className="inline-flex items-center justify-center gap-2 min-h-[36px] font-semibold text-xs rounded px-3 border border-outline-variant text-secondary bg-transparent hover:bg-surface-container-low transition-colors">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {query.isLoading ? (
          <p className="m-0 p-9 text-on-surface-variant text-center">Loading applications...</p>
        ) : table.getRowModel().rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} scope="col" className="bg-surface-container-low text-outline text-xs font-semibold tracking-wider uppercase p-3.5 border-b border-surface-container-highest text-left">
                          <button
                            className="inline-flex items-center gap-1.5 p-0 bg-transparent border-0 text-inherit font-inherit font-semibold uppercase cursor-pointer"
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
                      className="cursor-pointer transition-all hover:bg-surface-container-low hover:translate-x-1"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3.5 border-b border-surface-container-highest text-left align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-3 px-6 border-t border-outline-variant bg-surface-container-low text-sm text-on-surface-variant">
              <span>
                Showing 1 to {table.getRowModel().rows.length} of {filteredData.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button className="flex items-center justify-center w-8 h-8 border border-outline-variant rounded bg-transparent text-outline text-base cursor-pointer hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                  ‹
                </button>
                <span className="flex items-center justify-center w-8 h-8 rounded bg-primary text-white font-semibold text-sm">1</span>
                <button className="flex items-center justify-center w-8 h-8 border border-outline-variant rounded bg-transparent text-outline text-base cursor-pointer hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">›</button>
              </div>
            </div>
          </>
        ) : (
          <p className="m-0 p-9 text-on-surface-variant text-center">No applications found in this stage.</p>
        )}
      </section>
    </div>
  )
}
