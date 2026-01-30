import React from 'react';
import { FaLongArrowAltLeft } from "react-icons/fa";
import {useNavigate} from "react-router-dom" ;


const ProvisioningSetting = () => {

  const navigate = useNavigate() ;
    return(
        <>
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
               <div className="flex items-center gap-3 p-6 cursor-pointer">
                    <span className="text-gray-500 relative left-6  pb-8" onClick={() => navigate('/settings')}>
                         <FaLongArrowAltLeft size={16}  />
                    </span>
                    <div>
                        <p className="text-sm text-gray-600 pl-6">Back to Settings</p>
                        <h1 className="text-2xl font-semibold mt-1">Provisioning Settings</h1>
                        {/* <p className="text-xs text-gray-600">Connect and manage your identity provider integrations</p> */}
                  </div>
                </div>
            </div>


            <div className="p-6  w-full space-y-2">
                <div className="w-full  rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Auto-Provisioning
      </h2>
      <p className="text-sm text-gray-500">
        Automatically create accounts for new users
      </p>
    </div>

    {/* Toggle */}
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" defaultChecked />
      <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
    </label>
  </div>

  {/* Divider */}
  <div className="my-5 border-t border-gray-200" />

  {/* Provisioning Trigger */}
  <div className="space-y-3">
    <p className="text-sm font-medium text-gray-700">
      Provisioning Trigger:
    </p>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        defaultChecked
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      New user detected in identity provider
    </label>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        defaultChecked
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      User added to specific group
    </label>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      Manual approval required
    </label>
  </div>

  {/* Default Role */}
  <div className="mt-6 space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Default Role
    </label>

    <select className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <option>Standard User</option>
      <option>Manager</option>
      <option>Admin</option>
      <option>Read Only</option>
    </select>
  </div>
</div>

            </div>
            <div className="p-6 w-full space-y-2">
                <div className="w-full  rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  {/* Title */}
  <h2 className="text-lg font-semibold text-gray-900">
    User Synchronization
  </h2>

  {/* Top Section */}
  <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
    {/* Sync Frequency */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Sync Frequency
      </label>

      <select className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option>Every 15 minutes</option>
        <option>Every 30 minutes</option>
        <option selected>Every 1 hour</option>
        <option>Every 6 hours</option>
        <option>Daily</option>
      </select>

      <p className="text-sm text-gray-500">
        Last Sync
        <span className="ml-1 font-medium text-gray-900">
          15 minutes ago
        </span>
      </p>
    </div>

    {/* Status */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Status
      </label>

      <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        Active
      </div>

      <p className="text-sm text-gray-500">
        Users Synced
        <span className="ml-1 font-semibold text-gray-900">
          1,247
        </span>
      </p>
    </div>
  </div>

  {/* Sync Attributes */}
  <div className="mt-6 space-y-3">
    <p className="text-sm font-medium text-gray-700">
      Sync Attributes:
    </p>

    <div className="flex flex-wrap gap-5 text-sm text-gray-700">
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
        Email
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
        Name
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
        Department
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
        Job Title
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
        Phone
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
        Manager
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" className="h-4 w-4 text-indigo-600" />
        Custom Attributes
      </label>
    </div>
  </div>

  {/* Actions */}
  <div className="mt-6 flex gap-4">
    <button className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
      Sync Now
    </button>

    <button className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
      View Sync Logs
    </button>
  </div>
</div>

            </div>
            <div className="p-6 w-full space-y-2">
                <div className="w-full  rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  {/* Title */}
  <h2 className="text-lg font-semibold text-gray-900">
    Deprovisioning Rules
  </h2>

  {/* Rule Selection */}
  <div className="mt-5 space-y-4">
    <p className="text-sm font-medium text-gray-700">
      When user removed from provider:
    </p>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="radio"
        name="deprovision"
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
      />
      Suspend Account
    </label>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="radio"
        name="deprovision"
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
      />
      Delete Account
    </label>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="radio"
        name="deprovision"
        defaultChecked
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
      />
      Revoke Access Only
    </label>
  </div>

  {/* Grace Period */}
  <div className="mt-6 space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Grace Period (days)
    </label>

    <input
      type="number"
      defaultValue="7"
      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  {/* Options */}
  <div className="mt-6 space-y-3">
    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        defaultChecked
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      Send notification to user
    </label>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        defaultChecked
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      Send notification to admin
    </label>

    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        defaultChecked
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      Archive user data before deletion
    </label>
  </div>
</div>

            </div>
            <div  className="p-6 w-full space-y-2">
                <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Approval Workflows
      </h2>
      <p className="text-sm text-gray-500">
        Require approval for provisioning requests
      </p>
    </div>

    {/* Toggle */}
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" />
      <div className="peer h-7 w-12 rounded-full bg-gray-300 after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-400 peer-checked:after:translate-x-full" />
    </label>
  </div>

  {/* Approvers */}
  <div className="mt-6 space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Approvers
    </label>

    <select className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <option>Department Heads</option>
      <option>Managers</option>
      <option>Admins</option>
      <option>Custom Group</option>
    </select>
  </div>

  {/* Timeout */}
  <div className="mt-6 space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Timeout (hours)
    </label>

    <input
      type="number"
      defaultValue="48"
      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
</div>

            </div>
            <div className="px-6 py-2" >

                <div className="mt-1 flex items-center gap-6">
  <button className="rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    Save Changes
  </button>

  <button className="text-sm font-medium text-gray-700 bg-gray-200 px-6 py-3 rounded-md font-semibold hover:text-gray-900">
    Reset
  </button>
</div>

            </div>

        </div>
        
        
        </>
    );
} ;


export default ProvisioningSetting;