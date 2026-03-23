"use client"

import { createTransaction, updateTransaction } from '@/actions/transaction'
import { transactionSchema } from '@/app/lib/schema'
import { CreateAccountDrawer } from '@/components/create-account-drawer'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import useFetch from '@/hooks/use-fetch'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ReceiptScanner } from './receipt-scanner'

const AddTransactionForm = ({ accounts, categories, editMode = false, initialData = null }) => {
  const router = useRouter()
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const defaultAccountId = accounts.find(ac => ac.isDefault)?.id

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: 
    editMode && initialData ? {
      type: initialData.type,
      amount: initialData.amount.toString(),
      description: initialData.description,
      accountId: initialData.accountId,
      date: initialData.date,
      isRecurring: initialData.isRecurring,
      ...(initialData.recurringInterval && {recurringInterval: initialData.recurringInterval})
    } : {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: defaultAccountId,
      date: new Date(),
      isRecurring: false,
    },
  })

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const type = watch("type")
  const isRecurring = watch("isRecurring")
  const date = watch("date")
  const categoryValue = watch("category")
  const accountValue = watch("accountId")
  const recurringIntervalValue = watch("recurringInterval")

  const filteredCategories = categories.filter(
    (category) => category.type === type
  )

  // clear category when type changes
  useEffect(() => {
    setValue("category", undefined)
  }, [type, setValue])

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(editMode ? "Transaction updated successfully" : "Transaction created successfully")

      reset({
        type: "EXPENSE",
        amount: "",
        description: "",
        accountId: defaultAccountId,
        date: new Date(),
        isRecurring: false,
      })

      router.push(`/account/${transactionResult.data.accountId}`)
    }
  }, [transactionResult, transactionLoading, router, reset, defaultAccountId, editMode])

  const onSubmit = (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };

    if(editMode) {
      transactionFn({
        editId,
        ...formData,
      })
    } else {
      transactionFn({
        ...formData,
      })
    }
  }

  const handleScanComplete = (scannedData) => {
    if (!scannedData) return

    setValue("amount", scannedData.amount.toString(), {
      shouldValidate: true,
      shouldDirty: true,
    })

    setValue("date", new Date(scannedData.date), {
      shouldValidate: true,
      shouldDirty: true,
    })

    if (scannedData.description) {
      setValue("description", scannedData.description, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }

    if (scannedData.category) {
      setValue("category", scannedData.category, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }

    toast.success("Receipt scanned successfully")
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          value={type}
          onValueChange={(value) => setValue("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
      </div>

      {/* Amount + Account */}
      <div className="grid gap-6 md:grid-cols-2">

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            value={accountValue}
            onValueChange={(value) => setValue("accountId", value)}
          >
            <SelectTrigger>
              <SelectValue>
                {
                  accounts.find(acc => acc.id === accountValue)?.name
                  || "Select account"
                }
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-sm text-red-500">{errors.accountId.message}</p>}
        </div>

      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={categoryValue}
          onValueChange={(value) => setValue("category", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal")}>
              {date ? format(date, "PPP") : "Pick a date"}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => setValue("date", d, { shouldValidate: true })}
              disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description" {...register("description")} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Recurring */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">
            Set up a recurring schedule
          </div>
        </div>

        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            value={recurringIntervalValue}
            onValueChange={(value) => setValue("recurringInterval", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">{errors.recurringInterval.message}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          Cancel
        </Button>

        <Button type="submit" className="flex-1" disabled={transactionLoading}>
          {transactionLoading ? (
            <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin'/>
            {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? "Update Transaction" : "Create Transaction"}
        </Button>
      </div>

    </form>
  )
}

export default AddTransactionForm