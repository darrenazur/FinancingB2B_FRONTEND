'use client'

import { useState } from 'react'
import '../../globals.css';

export default function FormPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // TODO: integrate your API here
  }

  const handleCancel = () => {
    setFormData({ name: '', email: '', password: '' })
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto my-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div className="rounded-2xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-subtle)' }}>
                <div className="p-6 max-w-3xl mx-auto">
                    <h1 className="text-2xl font-semibold" style={{ color:'var(--text-primary)' }}>
                        User Form 
                    </h1>
                    <form
                        onSubmit={handleSubmit}
                    >
                        <div className='space-y-12'>
                            <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                                <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">Use a permanent address where you can receive mail.</p>

                                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">First name</label>
                                        <div className="mt-2">
                                            <input id="first-name" type="text" name="first-name" autoComplete="given-name" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Last name</label>
                                        <div className="mt-2">
                                            <input id="last-name" type="text" name="last-name" autoComplete="family-name" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-4">
                                        <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Email address</label>
                                        <div className="mt-2">
                                            <input id="email" type="email" name="email" autoComplete="email" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Country</label>
                                        <div className="mt-2 grid grid-cols-1">
                                            <select id="country" name="country" autoComplete="country-name" className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-indigo-500">
                                                <option>United States</option>
                                                <option>Canada</option>
                                                <option>Mexico</option>
                                            </select>
                                            <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400">
                                            <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" fillRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="col-span-full">
                                        <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Street address</label>
                                        <div className="mt-2">
                                            <input id="street-address" type="text" name="street-address" autoComplete="street-address" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 sm:col-start-1">
                                        <label htmlFor="city" className="block text-sm/6 font-medium text-gray-900 dark:text-white">City</label>
                                        <div className="mt-2">
                                            <input id="city" type="text" name="city" autoComplete="address-level2" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="region" className="block text-sm/6 font-medium text-gray-900 dark:text-white">State / Province</label>
                                        <div className="mt-2">
                                            <input id="region" type="text" name="region" autoComplete="address-level1" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="postal-code" className="block text-sm/6 font-medium text-gray-900 dark:text-white">ZIP / Postal code</label>
                                        <div className="mt-2">
                                            <input id="postal-code" type="text" name="postal-code" autoComplete="postal-code" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>


                                </div>
                            </div>
                            
                            <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">Rate Details</h2>
                                <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">We'll always let you know about important changes, but you pick what else you want to hear about.</p>

                                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="price" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Price</label>
                                        <div className="flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-gray-600 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-500">
                                            <div className="shrink-0 text-base text-gray-400 select-none sm:text-sm/6">₱</div>
                                            <input id="price" type="text" name="price" placeholder="0.00" className="block min-w-0 grow bg-gray-800 py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6" />
                                            <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                                                <select id="currency" name="currency" aria-label="Currency" className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-gray-800 py-1.5 pr-7 pl-3 text-base text-gray-400 *:bg-gray-800 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6">
                                                <option>PHP</option>
                                                </select>
                                                <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-400 sm:size-4">
                                                <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label htmlFor="interest-rate" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Interest Rate (%)</label>
                                        <div className="mt-2">
                                            <input id="interest-rate" type="number" name="interest-rate" step="0" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="tenure" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Tenure</label>
                                        <div className="mt-2 grid grid-cols-1">
                                            <select id="tenure" name="tenure" autoComplete="tenure" className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-indigo-500">
                                            <option>Daily</option>
                                            <option>Weekly</option>
                                            <option>Semi-Monthly</option>
                                            <option>Monthly</option>
                                            </select>
                                            <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400">
                                            <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" fillRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-x-6">
                            <button type="button" className="text-sm/6 font-semibold text-gray-900 dark:text-white">Cancel</button>
                            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:focus-visible:outline-indigo-500">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
  )
}