import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDownUp, FilePlus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import ErrorMessage from '../components/ErrorMessage'
import StatusBadge from '../components/StatusBadge'

function formatDate(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export default function ApplicationListPage() {
  const navigate = useNavigate()
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }])

  const query = useQuery({
    queryKey: ['applications'],
    queryFn: applicationsApi.list,
  })

  const columns = useMemo(
    () => [
      {
        accessorKey: 'tracking_number',
        header: 'Tracking #',
        cell: ({ row, getValue }) => (
          <Link
            className="table-link"
            to="/applications/$id"
            params={{ id: String(row.original.id) }}
          >
            {getValue()}
          </Link>
        ),
      },
      { accessorKey: 'applicant_name', header: 'Applicant' },
      { accessorKey: 'company_name', header: 'Company' },
      { accessorKey: 'application_type', header: 'Type' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => formatDate(getValue()),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: query.data || [],
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h1>AppFlow Tracker</h1>
        </div>
        <Link className="button button--primary" to="/applications/new">
          <FilePlus aria-hidden="true" size={18} />
          New application
        </Link>
      </section>

      <section className="toolbar" aria-label="Application controls">
        <label className="search-field">
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Search applications</span>
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search tracking, applicant, company, type, or status"
          />
        </label>
      </section>

      <ErrorMessage>{query.isError ? getApiErrorMessage(query.error) : ''}</ErrorMessage>

      <section className="table-surface" aria-busy={query.isLoading}>
        {query.isLoading ? (
          <p className="empty-state">Loading applications...</p>
        ) : table.getRowModel().rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} scope="col">
                        <button className="table-sort" type="button" onClick={header.column.getToggleSortingHandler()}>
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
                        params: { id: String(row.original.id) },
                      })
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No applications found.</p>
        )}
      </section>
    </main>
  )
}
