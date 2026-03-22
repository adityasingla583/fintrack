import { getUserAccounts } from '@/actions/dashboard'
import { defaultCategories } from '@/data/categories';
import React from 'react'
import AddTransactionForm from '../_components/transaction-form';
import { getTransaction } from '@/actions/transaction';

const AddTransactionPage = async({searchParams}) => {
    const accounts = await getUserAccounts();
    const { edit: editId} = await searchParams;

    let initialData = null;
    if (editId) {
        // Fetch the transaction data for the given editId and set it as initialData
        // You can create a function like getTransactionById(editId) to fetch this data
        // initialData = await getTransactionById(editId);

        const transaction = await getTransaction(editId);
        if (transaction) {
            initialData = transaction;
        } else {
            // Handle the case where the transaction is not found (e.g., show an error message or redirect)
            console.error('Transaction not found for editId:', editId);
        }
    }
  return (
    <div className='max-w-3xl mx-auto px-5'>
      <h1 className='text-5xl  gradient-title mb-8'>{editId ? 'Edit' : 'Add'} Transaction</h1>

      <AddTransactionForm accounts = {accounts} categories={defaultCategories} editMode={!!editId} initialData={initialData} />
    </div>
  )
}

export default AddTransactionPage
