import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditProductPage({ params }) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    redirect('/admin/products');
  }

  await dbConnect();

  const product = await Product.findById(id).lean();

  if (!product) {
    redirect('/admin/products');
  }

  const serializedProduct = {
    ...product,
    _id: product._id.toString(),
  };

  return (
    <ProductForm 
      initialData={serializedProduct} 
      productId={serializedProduct._id} 
    />
  );
}
